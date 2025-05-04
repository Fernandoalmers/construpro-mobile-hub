
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

// Import our components
import ProductBreadcrumbs from './components/ProductBreadcrumbs';
import ProductImageGallery from './components/ProductImageGallery';
import ProductInfo from './components/ProductInfo';
import ProductDetails from './components/ProductDetails';
import QuantitySelector from './components/QuantitySelector';
import ProductActions from './components/ProductActions';

// Import our hook
import { useProductDetails } from '@/hooks/useProductDetails';

const ProdutoScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [quantidade, setQuantidade] = useState(1);
  
  // Use our custom hook
  const { product: produto, loading, error, isFavorited, reviews } = useProductDetails(id, isAuthenticated);

  const handleQuantityChange = (delta: number) => {
    // For products sold by m² or with specific unit requirements
    const isM2Product = produto?.unidade_medida?.toLowerCase().includes('m²') || 
                        produto?.unidade_medida?.toLowerCase().includes('m2');
    
    // Default step is 1, but for m² products we might use a custom multiple
    const step = isM2Product && produto?.unidade_medida ? parseFloat(produto.unidade_medida) || 1 : 1;
    
    const newValue = quantidade + (delta * step);
    if (newValue >= step && newValue <= (produto?.estoque || step)) {
      setQuantidade(newValue);
    }
  };

  const validateQuantity = () => {
    const isM2Product = produto?.unidade_medida?.toLowerCase().includes('m²') || 
                       produto?.unidade_medida?.toLowerCase().includes('m2');
    
    if (isM2Product && produto?.unidade_medida) {
      const step = parseFloat(produto.unidade_medida) || 1;
      // Round to the nearest multiple of step
      const roundedValue = Math.round(quantidade / step) * step;
      if (roundedValue !== quantidade) {
        setQuantidade(roundedValue);
        toast.info(`Quantidade ajustada para ${roundedValue} ${produto.unidade_medida}`);
      }
    }
  };

  const handleAddReview = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${id}` } });
      return;
    }
    
    // In a full implementation, this would open a review dialog
    toast.info('Funcionalidade de avaliação em desenvolvimento');
  };

  if (loading) {
    return <LoadingState text="Carregando detalhes do produto..." />;
  }

  if (error || !produto) {
    return (
      <ErrorState 
        title="Erro ao carregar produto" 
        message={error || "Produto não encontrado"}
        onRetry={() => navigate('/marketplace')}
      />
    );
  }

  const hasDiscount = (produto.preco_anterior || 0) > (produto.preco || 0);
  const discountPercentage = hasDiscount 
    ? Math.round(((produto.preco_anterior - produto.preco) / produto.preco_anterior) * 100)
    : 0;

  return (
    <div className="bg-gray-100 min-h-screen pb-16">
      {/* Breadcrumb navigation */}
      <ProductBreadcrumbs 
        productName={produto.nome} 
        productCategory={produto.categoria} 
        productCode={produto.sku || produto.id.substring(0, 8)}
      />

      <main className="container mx-auto mt-4 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image Section */}
          <ProductImageGallery
            mainImage={produto.imagem_url || ''}
            images={produto.imagens}
            productName={produto.nome}
            hasDiscount={hasDiscount}
            discountPercentage={discountPercentage}
          />

          {/* Product Info Section */}
          <div>
            <ProductInfo 
              produto={produto}
            />
            
            {/* Quantity Selector */}
            <QuantitySelector 
              produto={produto}
              quantidade={quantidade}
              onQuantityChange={handleQuantityChange}
            />
            
            {/* Product Actions */}
            <ProductActions
              produto={produto}
              quantidade={quantidade}
              isFavorited={isFavorited}
              validateQuantity={validateQuantity}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
        
        {/* Product Description and Reviews */}
        <ProductDetails 
          description={produto.descricao}
          reviews={reviews}
          canReview={isAuthenticated}
          onAddReview={handleAddReview}
        />
        
        {/* Back button */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => navigate('/marketplace')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para os produtos
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProdutoScreen;
