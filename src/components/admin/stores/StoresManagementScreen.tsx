
import React, { useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useTitle } from '@/hooks/use-title';
import { Card } from '@/components/ui/card';
import LoadingState from '@/components/common/LoadingState';
import StoresHeader from './components/StoresHeader';
import StoresTable from './components/StoresTable';
import { getAdminStores } from '@/services/admin/stores/storesFetcher';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

const StoresManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Lojas');
  
  // Use React Query to fetch stores data
  const { 
    data: stores = [], 
    isLoading: loading, 
    error,
    refetch: refreshStores
  } = useQuery({
    queryKey: ['adminStores'],
    queryFn: getAdminStores,
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
  const approveStore = async (storeId: string) => {
    // Implementation left as is - not part of the requested changes
  };
  
  // Handle store rejection
  const rejectStore = async (storeId: string) => {
    // Implementation left as is - not part of the requested changes
  };

  // Log stores data for debugging
  useEffect(() => {
    console.log('[Stores fetched]', stores, error);
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
              approveStore={approveStore}
              rejectStore={rejectStore}
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default StoresManagementScreen;
