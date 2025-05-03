
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '@/services/adminService';

export interface StoreData {
  id: string;
  nome: string;
  descricao?: string;
  logo_url?: string;
  contato?: string;
  status?: string;
  owner_id?: string;
  proprietario_id?: string;
  owner_name?: string;
  created_at: string;
}

export const useAdminStores = (initialFilter: string = 'all') => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStores = async () => {
    try {
      setLoading(true);
      
      // First try with lojas table
      const { data: lojasData, error: lojasError } = await supabase
        .from('lojas')
        .select('id, nome, logo_url, proprietario_id, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      // If that fails, try with stores table
      const { data: storesData, error: storesError } = lojasError ? await supabase
        .from('stores')
        .select('id, nome, logo_url, owner_id, contato, created_at, updated_at, descricao')
        .order('created_at', { ascending: false }) : { data: null, error: null };

      if (lojasError && storesError) {
        throw storesError || lojasError;
      }

      const storeData = lojasData || storesData || [];
      
      // Get owner IDs from the data
      const ownerIds = storeData
        .map(store => store.proprietario_id || store.owner_id)
        .filter(Boolean);
      
      let ownerNames: Record<string, string> = {};
      
      if (ownerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nome')
          .in('id', ownerIds);
          
        if (profilesData) {
          ownerNames = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.nome || 'Usuário';
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Format the store data
      const formattedStores = storeData.map(store => {
        // Handle the case where the field might be from either table
        const ownerId = store.proprietario_id || store.owner_id;
        
        return {
          id: store.id,
          nome: store.nome,
          descricao: (store as any).descricao,
          logo_url: store.logo_url,
          contato: (store as any).contato,
          status: store.status || 'pendente',
          owner_id: ownerId,
          proprietario_id: ownerId,
          owner_name: ownerNames[ownerId] || 'Proprietário desconhecido',
          created_at: store.created_at
        };
      });

      setStores(formattedStores);
      applyFilters(formattedStores, filter, searchTerm);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      toast.error('Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (stores: StoreData[], statusFilter: string, search: string) => {
    let filtered = [...stores];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(store => store.status === statusFilter);
    }
    
    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        store => 
          store.nome.toLowerCase().includes(lowerSearch) ||
          (store.descricao && store.descricao.toLowerCase().includes(lowerSearch)) ||
          (store.owner_name && store.owner_name.toLowerCase().includes(lowerSearch))
      );
    }
    
    setFilteredStores(filtered);
  };

  const approveStore = async (storeId: string) => {
    try {
      // Try updating 'lojas' table first
      const { error: lojasError } = await supabase
        .from('lojas')
        .update({ status: 'ativa', updated_at: new Date().toISOString() })
        .eq('id', storeId);
      
      // If that fails, try 'stores' table
      if (lojasError) {
        const { error: storesError } = await supabase
          .from('stores')
          .update({ status: 'ativa', updated_at: new Date().toISOString() })
          .eq('id', storeId);
          
        if (storesError) throw storesError;
      }
      
      await logAdminAction({
        action: 'approve_store',
        entityType: 'loja',
        entityId: storeId,
        details: { status: 'ativa' }
      });
      
      toast.success('Loja aprovada com sucesso');
      
      // Update local state
      setStores(prevStores => 
        prevStores.map(store => 
          store.id === storeId 
            ? { ...store, status: 'ativa' } 
            : store
        )
      );
      
      // Re-apply filters
      applyFilters(
        stores.map(store => 
          store.id === storeId 
            ? { ...store, status: 'ativa' } 
            : store
        ),
        filter,
        searchTerm
      );
    } catch (error) {
      console.error('Error approving store:', error);
      toast.error('Erro ao aprovar loja');
    }
  };

  const rejectStore = async (storeId: string) => {
    try {
      // Try updating 'lojas' table first
      const { error: lojasError } = await supabase
        .from('lojas')
        .update({ status: 'inativa', updated_at: new Date().toISOString() })
        .eq('id', storeId);
      
      // If that fails, try 'stores' table
      if (lojasError) {
        const { error: storesError } = await supabase
          .from('stores')
          .update({ status: 'inativa', updated_at: new Date().toISOString() })
          .eq('id', storeId);
          
        if (storesError) throw storesError;
      }
      
      await logAdminAction({
        action: 'reject_store',
        entityType: 'loja',
        entityId: storeId,
        details: { status: 'inativa' }
      });
      
      toast.success('Loja rejeitada com sucesso');
      
      // Update local state
      setStores(prevStores => 
        prevStores.map(store => 
          store.id === storeId 
            ? { ...store, status: 'inativa' } 
            : store
        )
      );
      
      // Re-apply filters
      applyFilters(
        stores.map(store => 
          store.id === storeId 
            ? { ...store, status: 'inativa' } 
            : store
        ),
        filter,
        searchTerm
      );
    } catch (error) {
      console.error('Error rejecting store:', error);
      toast.error('Erro ao rejeitar loja');
    }
  };

  // Initial load
  useEffect(() => {
    fetchStores();
    
    // Set up realtime subscription for stores
    const storesChannel = supabase
      .channel('stores_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'stores' }, 
        () => {
          fetchStores();
        }
      )
      .subscribe();
      
    const lojasChannel = supabase
      .channel('lojas_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lojas' }, 
        () => {
          fetchStores();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(storesChannel);
      supabase.removeChannel(lojasChannel);
    };
  }, []);

  // Apply filters when filter or search changes
  useEffect(() => {
    applyFilters(stores, filter, searchTerm);
  }, [filter, searchTerm, stores]);

  return {
    stores: filteredStores,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    approveStore,
    rejectStore,
    refreshStores: fetchStores
  };
};
