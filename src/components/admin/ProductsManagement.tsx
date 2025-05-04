
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
import { toast } from '@/components/ui/use-toast';
import { approveProduct, rejectProduct } from '@/services/admin/products/adminProductActions';

const ProductsManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Produtos');
  
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

  // Implementation for approve product handler using the service
  async function handleApproveProduct(productId: string) {
    try {
      // Log before calling the service
      console.log('[ApproveProduct] Approving product with ID:', productId);
      
      // Use the adminProductActions service
      const success = await approveProduct(productId);
      
      console.log('[ApproveProduct] Result:', success);
      
      if (!success) {
        toast({
          title: "Error",
          description: "Erro ao aprovar produto",
          variant: "destructive"
        });
        return;
      }

      // Refresh the products list
      await refreshProducts();
      toast({
        title: "Sucesso",
        description: "Produto aprovado com sucesso"
      });
    } catch (error) {
      console.error('[ApproveProduct] Error:', error);
      toast({
        title: "Error",
        description: "Erro inesperado ao aprovar produto",
        variant: "destructive"
      });
    }
  }

  // Implementation for reject product handler using the service
  async function handleRejectProduct(productId: string) {
    try {
      // Log before calling the service
      console.log('[RejectProduct] Rejecting product with ID:', productId);
      
      // Use the adminProductActions service
      const success = await rejectProduct(productId);
      
      console.log('[RejectProduct] Result:', success);
      
      if (!success) {
        toast({
          title: "Error",
          description: "Erro ao rejeitar produto",
          variant: "destructive"
        });
        return;
      }

      // Refresh the products list
      await refreshProducts();
      toast({
        title: "Sucesso",
        description: "Produto rejeitado com sucesso"
      });
    } catch (error) {
      console.error('[RejectProduct] Error:', error);
      toast({
        title: "Error",
        description: "Erro inesperado ao rejeitar produto",
        variant: "destructive"
      });
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
