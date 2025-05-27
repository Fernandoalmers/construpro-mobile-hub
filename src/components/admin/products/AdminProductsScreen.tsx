
import React, { useState } from 'react';
import AdminLayout from '../AdminLayout';
import ProductsTable from './ProductsTable';
import ProductsHeader from './ProductsHeader';
import ProductFilters from './ProductFilters';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { updateProductStatus } from '@/services/admin/products';
import { toast } from '@/components/ui/sonner';

const AdminProductsScreen: React.FC = () => {
  const {
    products,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    refreshProducts
  } = useAdminProducts();

  const handleApproveProduct = async (productId: string) => {
    try {
      await updateProductStatus(productId, 'aprovado');
      toast.success('Produto aprovado com sucesso');
      refreshProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Erro ao aprovar produto');
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      await updateProductStatus(productId, 'inativo');
      toast.success('Produto rejeitado');
      refreshProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Erro ao rejeitar produto');
    }
  };

  const debugData = async () => {
    console.log('Products data:', products);
    console.log('Filter:', filter);
    console.log('Search term:', searchTerm);
    console.log('Loading:', loading);
  };

  return (
    <AdminLayout currentSection="produtos">
      <div className="space-y-6">
        <ProductsHeader 
          productCount={products.length}
          debugData={debugData}
        />
        
        <ProductFilters
          filter={filter}
          setFilter={setFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          products={products}
        />
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Carregando produtos...</div>
          </div>
        ) : (
          <ProductsTable 
            products={products}
            handleApproveProduct={handleApproveProduct}
            handleRejectProduct={handleRejectProduct}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductsScreen;
