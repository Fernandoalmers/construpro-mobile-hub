
import { useState, useEffect } from 'react';
import { 
  getAdminStores, 
  approveStore, 
  rejectStore, 
  subscribeToAdminStoreUpdates 
} from '@/services/admin/stores';
import { AdminStore } from '@/types/admin';
import { toast } from '@/components/ui/sonner';

export const useAdminStores = (initialFilter: string = 'all') => {
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [filteredStores, setFilteredStores] = useState<AdminStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');

  const loadStores = async () => {
    try {
      setLoading(true);
      console.log('Loading admin stores...');
      const storesData = await getAdminStores();
      console.log('Admin stores loaded:', storesData);
      setStores(storesData);
      applyFilters(storesData, filter, searchTerm);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (stores: AdminStore[], statusFilter: string, search: string) => {
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
          (store.proprietario_nome && store.proprietario_nome.toLowerCase().includes(lowerSearch))
      );
    }
    
    setFilteredStores(filtered);
  };

  const handleApproveStore = async (storeId: string) => {
    try {
      console.log('Approving store with ID:', storeId);
      const success = await approveStore(storeId);
      
      if (success) {
        // Refresh stores data to ensure we have the latest data
        await loadStores();
        toast.success('Loja aprovada com sucesso');
      }
    } catch (error) {
      console.error('Error approving store:', error);
      toast.error('Erro ao aprovar loja');
    }
  };

  const handleRejectStore = async (storeId: string) => {
    try {
      console.log('Rejecting store with ID:', storeId);
      const success = await rejectStore(storeId);
      
      if (success) {
        // Refresh stores data to ensure we have the latest data
        await loadStores();
        toast.success('Loja rejeitada com sucesso');
      }
    } catch (error) {
      console.error('Error rejecting store:', error);
      toast.error('Erro ao rejeitar loja');
    }
  };

  // Initial load
  useEffect(() => {
    loadStores();
    
    // Set up realtime subscription for stores
    const { unsubscribe } = subscribeToAdminStoreUpdates((_, eventType) => {
      if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
        // Reload stores when changes occur
        console.log('Realtime store update detected, reloading stores...');
        loadStores();
      }
    });
      
    return () => {
      unsubscribe();
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
    approveStore: handleApproveStore,
    rejectStore: handleRejectStore,
    refreshStores: loadStores
  };
};
