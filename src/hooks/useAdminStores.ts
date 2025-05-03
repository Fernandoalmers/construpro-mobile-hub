
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
      // Check if lojas table exists by fetching a single row
      const { error: testError } = await supabase
        .from('lojas')
        .select('id')
        .limit(1);
      
      // If there's an error, try the stores table instead
      const tableName = testError ? 'stores' : 'lojas';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get owner names from profiles
      const ownerIds = data
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
      const formattedStores = data.map(store => ({
        id: store.id,
        nome: store.nome,
        descricao: store.descricao,
        logo_url: store.logo_url,
        contato: store.contato,
        status: store.status || 'pendente',
        owner_id: store.proprietario_id || store.owner_id,
        owner_name: ownerNames[store.proprietario_id || store.owner_id] || 'Proprietário desconhecido',
        created_at: store.created_at
      }));

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
      // Check if lojas table exists by fetching a single row
      const { error: testError } = await supabase
        .from('lojas')
        .select('id')
        .eq('id', storeId)
        .limit(1);
      
      // If there's an error, try the stores table instead
      const tableName = testError ? 'stores' : 'lojas';
      
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'ativa', updated_at: new Date().toISOString() })
        .eq('id', storeId);
      
      if (error) throw error;
      
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
      // Check if lojas table exists by fetching a single row
      const { error: testError } = await supabase
        .from('lojas')
        .select('id')
        .eq('id', storeId)
        .limit(1);
      
      // If there's an error, try the stores table instead
      const tableName = testError ? 'stores' : 'lojas';
      
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'inativa', updated_at: new Date().toISOString() })
        .eq('id', storeId);
      
      if (error) throw error;
      
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
