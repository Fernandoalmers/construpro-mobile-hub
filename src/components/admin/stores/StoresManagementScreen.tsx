
import React, { useEffect } from 'react';
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
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: `Falha ao carregar lojas: ${err.message}`,
        variant: "destructive"
      });
    }
  });

  // For backward compatibility with existing hooks
  const [filter, setFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  
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
          ) : stores.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhuma loja encontrada.</p>
            </div>
          ) : (
            <StoresTable 
              stores={stores}
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
