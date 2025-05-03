
import React from 'react';
import AdminLayout from '../AdminLayout';
import { useAdminStores } from '@/hooks/useAdminStores';
import { useTitle } from '@/hooks/use-title';
import { Card } from '@/components/ui/card';
import LoadingState from '@/components/common/LoadingState';
import StoresHeader from './components/StoresHeader';
import StoresTable from './components/StoresTable';

const StoresManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Lojas');
  
  const {
    stores,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    approveStore,
    rejectStore,
    refreshStores
  } = useAdminStores();

  console.log('Stores fetched:', stores);

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
