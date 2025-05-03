
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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

  // Implementation for approve product handler
  async function handleApproveProduct(productId: string) {
    // 1) Atualiza o status no Supabase
    const { data, error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado' })
      .eq('id', productId);

    console.log('[ApproveProduct] data:', data, 'error:', error);
    if (error) {
      toast.error('Erro ao aprovar: ' + error.message);
      return;
    }

    // 2) Refetch explícito da lista pendente
    await refreshProducts();
    toast.success('Produto aprovado com sucesso');
  }

  // Implementation for reject product handler
  async function handleRejectProduct(productId: string) {
    // 1) Atualiza o status no Supabase
    const { data, error } = await supabase
      .from('produtos')
      .update({ status: 'inativo' })
      .eq('id', productId);

    console.log('[RejectProduct] data:', data, 'error:', error);
    if (error) {
      toast.error('Erro ao rejeitar: ' + error.message);
      return;
    }

    // 2) Refetch explícito da lista pendente
    await refreshProducts();
    toast.success('Produto rejeitado com sucesso');
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
