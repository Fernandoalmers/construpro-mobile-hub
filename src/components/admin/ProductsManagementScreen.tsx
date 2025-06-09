
import React, { useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useTitle } from '@/hooks/use-title';
import { Card } from '@/components/ui/card';
import LoadingState from '@/components/common/LoadingState';
import ProductFilters from './products/ProductFilters';
import ProductsTable from './products/ProductsTable';
import ProductsHeader from './products/ProductsHeader';
import { debugFetchProducts } from '@/services/admin/products';
import { toast } from '@/components/ui/sonner';
import { approveProduct, rejectProduct } from '@/services/admin/products/productApproval/statusUpdates';
import { supabase } from '@/integrations/supabase/client';

const ProductsManagementScreen: React.FC = () => {
  useTitle('Matershop Admin - Produtos');
  
  const {
    products,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    refreshProducts
  } = useAdminProducts();

  // Debug function to help troubleshoot data issues
  const debugData = async () => {
    const result = await debugFetchProducts();
    console.log('Debug result:', result);
  };

  // Implementation for approve product handler using the productApproval service
  async function handleApproveProduct(productId: string) {
    try {
      // Log before calling the service
      console.log('[ApproveProduct] iniciando para id:', productId);
      
      // Use the productApproval service
      const success = await approveProduct(productId);
      
      console.log('[ApproveProduct] Result:', success);
      
      if (!success) {
        toast.error("Erro ao aprovar produto");
        return;
      }

      // Refresh the products list
      await refreshProducts();
      toast.success("Produto aprovado com sucesso");
    } catch (error) {
      console.error('[ApproveProduct] Error:', error);
      toast.error("Erro inesperado ao aprovar produto");
    }
  }

  // Implementation for reject product handler using the productApproval service
  async function handleRejectProduct(productId: string) {
    try {
      // Log before calling the service
      console.log('[RejectProduct] Rejecting product with ID:', productId);
      
      // Use the productApproval service
      const success = await rejectProduct(productId);
      
      console.log('[RejectProduct] Result:', success);
      
      if (!success) {
        toast.error("Erro ao rejeitar produto");
        return;
      }

      // Refresh the products list
      await refreshProducts();
      toast.success("Produto rejeitado com sucesso");
    } catch (error) {
      console.error('[RejectProduct] Error:', error);
      toast.error("Erro inesperado ao rejeitar produto");
    }
  }

  useEffect(() => {
    // Log the number of products loaded
    console.log(`ProductsManagement rendered with ${products.length} products`);
    console.log('Products data:', products);
  }, [products]);

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
        
        <Card>
          {loading ? (
            <div className="p-6">
              <LoadingState text="Carregando produtos..." />
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter !== 'all' ? 'Tente selecionar outro filtro acima.' : 'Verifique as configurações de conexão com o banco de dados.'}
              </p>
            </div>
          ) : (
            <ProductsTable 
              products={products}
              handleApproveProduct={handleApproveProduct}
              handleRejectProduct={handleRejectProduct}
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ProductsManagementScreen;
