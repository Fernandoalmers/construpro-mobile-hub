
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useTitle } from '@/hooks/use-title';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingState from '@/components/common/LoadingState';
import ProductFilters from './products/ProductFilters';
import ProductsTable from './products/ProductsTable';
import ProductsHeader from './products/ProductsHeader';
import ImageDiagnosticsPanel from './products/ImageDiagnosticsPanel';
import { debugFetchProducts } from '@/services/admin/products';
import { toast } from '@/components/ui/sonner';
import { approveProduct, rejectProduct } from '@/services/admin/products/productApproval/statusUpdates';
import { Bug, Package, AlertTriangle } from 'lucide-react';

const ProductsManagementScreen: React.FC = () => {
  useTitle('Matershop Admin - Produtos');
  
  const [showImageDiagnostics, setShowImageDiagnostics] = useState(true); // Ativado por padrão
  
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
    console.log('[ProductsManagement] Debug data requested');
    const result = await debugFetchProducts();
    console.log('Debug result:', result);
    
    // Log sample of products for image analysis
    if (products.length > 0) {
      console.group('[ProductsManagement] Sample product image data:');
      products.slice(0, 3).forEach(product => {
        console.log(`Product "${product.nome}":`, {
          id: product.id,
          imagemUrl: product.imagemUrl,
          imagens: product.imagens,
          status: product.status
        });
      });
      console.groupEnd();
    }
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
    // Enhanced logging for product data analysis
    console.group(`[ProductsManagement] Loaded ${products.length} products`);
    console.log('Products with images:', products.filter(p => p.imagens || p.imagemUrl).length);
    console.log('Products without images:', products.filter(p => !p.imagens && !p.imagemUrl).length);
    
    // Sample analysis of image data formats
    const sampleProducts = products.slice(0, 5);
    sampleProducts.forEach(product => {
      console.log(`Product "${product.nome}" image data:`, {
        imagemUrl: product.imagemUrl,
        imagens: product.imagens,
        imagensType: typeof product.imagens,
        imagensStringified: JSON.stringify(product.imagens)
      });
    });
    console.groupEnd();
  }, [products]);

  return (
    <AdminLayout currentSection="produtos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <ProductsHeader 
            productCount={products.length} 
            debugData={debugData} 
          />
          <div className="flex gap-2">
            <Button
              variant={showImageDiagnostics ? "default" : "outline"}
              size="sm"
              onClick={() => setShowImageDiagnostics(!showImageDiagnostics)}
            >
              <Bug size={16} className="mr-2" />
              {showImageDiagnostics ? 'Ocultar' : 'Mostrar'} Diagnósticos
            </Button>
          </div>
        </div>

        {/* Alert sobre diagnósticos ativados */}
        {showImageDiagnostics && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-blue-600" />
            <div>
              <div className="font-medium text-blue-800">Modo Diagnóstico Ativo</div>
              <div className="text-sm text-blue-600">
                As imagens estão sendo testadas em tempo real. Indicadores visuais mostram o status de cada imagem.
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package size={16} />
              Produtos ({products.length})
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2">
              <Bug size={16} />
              Diagnóstico de Imagens
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="space-y-6">
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
                  showImageDiagnostics={showImageDiagnostics}
                />
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="diagnostics">
            <ImageDiagnosticsPanel 
              products={products}
              onRefresh={refreshProducts}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ProductsManagementScreen;
