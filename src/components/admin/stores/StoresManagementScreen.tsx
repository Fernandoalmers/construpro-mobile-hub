
import React, { useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Card } from '@/components/ui/card';
import LoadingState from '@/components/common/LoadingState';
import StoresHeader from './components/StoresHeader';
import StoresTable from './components/StoresTable';
import { getAdminStores } from '@/services/admin/stores/storesFetcher';
import { approveStore, rejectStore } from '@/services/admin/stores/storeStatusManager';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

const StoresManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Lojas');
  
  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Use React Query to fetch stores data
  const { 
    data: stores = [], 
    isLoading: loading, 
    error,
    refetch: refreshStores
  } = useQuery({
    queryKey: ['adminStores'],
    queryFn: getAdminStores,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    meta: {
      onError: (err: any) => {
        toast({
          title: "Erro",
          description: `Falha ao carregar lojas: ${err.message}`,
          variant: "destructive"
        });
      }
    }
  });

  // State for filtering
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Apply filters to the stores data
  const filteredStores = useMemo(() => {
    let filtered = [...stores];
    
    // Apply status filter
    if (filter !== 'all') {
      if (filter === 'aprovado') {
        // Include both 'aprovado' and 'ativo' status for approved filter
        filtered = filtered.filter(store => 
          store.status === 'aprovado' || store.status === 'ativo'
        );
      } else {
        filtered = filtered.filter(store => store.status === filter);
      }
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(store => 
        store.nome.toLowerCase().includes(lowerSearch) ||
        (store.descricao && store.descricao.toLowerCase().includes(lowerSearch)) ||
        (store.proprietario_nome && store.proprietario_nome.toLowerCase().includes(lowerSearch))
      );
    }
    
    console.log('[StoresManagementScreen] Filtered stores:', {
      total: stores.length,
      filtered: filtered.length,
      filter,
      searchTerm
    });
    
    return filtered;
  }, [stores, filter, searchTerm]);
  
  // Handle store approval
  const handleApproveStore = async (storeId: string) => {
    try {
      console.log('[StoresManagementScreen] Starting approval process for store:', storeId);
      
      // Check if it's an incomplete store (temporary ID)
      if (storeId.startsWith('incomplete-')) {
        console.log('[StoresManagementScreen] Cannot approve incomplete store:', storeId);
        toast({
          title: "Ação não permitida",
          description: "Não é possível aprovar uma loja com registro incompleto. O proprietário precisa completar o cadastro da loja.",
          variant: "destructive"
        });
        return;
      }

      console.log('[StoresManagementScreen] Calling approveStore function...');
      const success = await approveStore(storeId);
      console.log('[StoresManagementScreen] Approval result:', success);
      
      if (success) {
        console.log('[StoresManagementScreen] Invalidating cache and refetching...');
        
        // Force invalidate all related queries
        await queryClient.invalidateQueries({ queryKey: ['adminStores'] });
        
        // Also force a refetch as backup
        await refreshStores();
        
        console.log('[StoresManagementScreen] Cache invalidated and data refetched');
        
        // Show success toast
        toast({
          title: "Sucesso",
          description: "Loja aprovada com sucesso!",
          variant: "default"
        });
      } else {
        console.error('[StoresManagementScreen] Approval failed - no success returned');
        toast({
          title: "Erro",
          description: "Falha ao aprovar loja. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[StoresManagementScreen] Error in approval process:', error);
      toast({
        title: "Erro",
        description: "Falha ao aprovar loja. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  // Handle store rejection
  const handleRejectStore = async (storeId: string) => {
    try {
      console.log('[StoresManagementScreen] Starting rejection process for store:', storeId);
      
      // Check if it's an incomplete store (temporary ID)
      if (storeId.startsWith('incomplete-')) {
        console.log('[StoresManagementScreen] Cannot reject incomplete store:', storeId);
        toast({
          title: "Ação não permitida",
          description: "Não é possível rejeitar uma loja com registro incompleto. O proprietário precisa completar o cadastro da loja primeiro.",
          variant: "destructive"
        });
        return;
      }

      console.log('[StoresManagementScreen] Calling rejectStore function...');
      const success = await rejectStore(storeId);
      console.log('[StoresManagementScreen] Rejection result:', success);
      
      if (success) {
        console.log('[StoresManagementScreen] Invalidating cache and refetching...');
        
        // Force invalidate all related queries
        await queryClient.invalidateQueries({ queryKey: ['adminStores'] });
        
        // Also force a refetch as backup
        await refreshStores();
        
        console.log('[StoresManagementScreen] Cache invalidated and data refetched');
        
        // Show success toast
        toast({
          title: "Sucesso",
          description: "Loja rejeitada com sucesso!",
          variant: "default"
        });
      } else {
        console.error('[StoresManagementScreen] Rejection failed - no success returned');
        toast({
          title: "Erro",
          description: "Falha ao rejeitar loja. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[StoresManagementScreen] Error in rejection process:', error);
      toast({
        title: "Erro",
        description: "Falha ao rejeitar loja. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Log stores data for debugging
  useEffect(() => {
    console.log('[StoresManagementScreen] Stores data updated:', {
      storesCount: stores.length,
      stores: stores.map(s => ({ id: s.id, nome: s.nome, status: s.status })),
      error
    });
  }, [stores, error]);

  return (
    <AdminLayout currentSection="lojas">
      <div className="space-y-6">
        <StoresHeader
          stores={stores}
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        <Card>
          {loading ? (
            <div className="p-6">
              <LoadingState text="Carregando lojas..." />
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Nenhuma loja encontrada com os filtros aplicados.' 
                  : 'Nenhuma loja encontrada.'
                }
              </p>
              {(searchTerm || filter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <StoresTable 
              stores={filteredStores}
              approveStore={handleApproveStore}
              rejectStore={handleRejectStore}
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StoresManagementScreen;
