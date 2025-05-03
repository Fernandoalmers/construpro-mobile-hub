
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
      const { data, error } = await supabase
        .from('lojas')
        .select(`
          id, 
          nome, 
          descricao, 
          logo_url, 
          contato,
          status,
          proprietario_id,
          created_at,
          profiles:proprietario_id (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the store data
      const formattedStores = data.map(store => ({
        id: store.id,
        nome: store.nome,
        descricao: store.descricao,
        logo_url: store.logo_url,
        contato: store.contato,
        status: store.status || 'pendente',
        owner_id: store.proprietario_id,
        owner_name: store.profiles?.nome || 'Proprietário desconhecido',
        created_at: store.created_at
      }));

      setStores(formattedStores);
      applyFilters(formattedStores, filter, searchTerm);
    } catch (error) {
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
      const { error } = await supabase
        .from('lojas')
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
      const { error } = await supabase
        .from('lojas')
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
    const channel = supabase
      .channel('stores_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lojas' }, 
        () => {
          fetchStores();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
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
