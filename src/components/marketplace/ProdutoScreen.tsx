
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import SearchHeader from './components/SearchHeader';
import CartPopup from './CartPopup';

// Import our refactored hook
import { useProductDetails } from '@/hooks/useProductDetails';

const ProdutoScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [quantidade, setQuantidade] = React.useState(1);
  const [showCartPopup, setShowCartPopup] = React.useState(false);
  
  // Use our custom hook
  const { product: produto, loading, error, isFavorited, reviews, estimatedDelivery } = useProductDetails(id, isAuthenticated);

  // Calculate the step value based on unit type
  const getStepValue = () => {
    if (!produto) return 1;
    
    const isM2Product = produto.unidade_medida?.toLowerCase().includes('m²') || 
                        produto.unidade_medida?.toLowerCase().includes('m2');
    
    if (isM2Product && produto.unidade_medida) {
      // Extract numeric value from unit measure if present
      const match = produto.unidade_medida.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 1;
    }
    
    return 1;
  };

  // Enforce stock limits on quantity
  React.useEffect(() => {
    if (produto && quantidade > (produto.estoque || 0)) {
      setQuantidade(Math.max(1, produto.estoque || 0));
    }
  }, [produto, quantidade]);

  const handleQuantityChange = (delta: number) => {
    const step = getStepValue();
    
    const newValue = quantidade + (delta * step);
    if (newValue >= step && (!produto || newValue <= (produto.estoque || step))) {
      setQuantidade(newValue);
    }
  };

  const validateQuantity = () => {
    const step = getStepValue();
    
    if (step > 1) {
      // Round to the nearest multiple of step
      const roundedValue = Math.round(quantidade / step) * step;
      if (roundedValue !== quantidade) {
        setQuantidade(roundedValue);
      }
    }
    
    // Ensure quantity doesn't exceed stock
    if (produto && quantidade > produto.estoque) {
      setQuantidade(Math.max(1, produto.estoque));
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Navigate to previous page
  };

  const handleProductActionSuccess = () => {
    setShowCartPopup(true);
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

  // Log product data for debugging
  console.log("Produto data:", produto);

  return (
    <div className="bg-gray-100 min-h-screen pb-16">
      {/* Header with search and cart */}
      <SearchHeader onGoBack={handleGoBack} />

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
              deliveryEstimate={estimatedDelivery}
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
              onSuccess={handleProductActionSuccess}
            />

            {/* Stock status */}
            {produto.estoque > 0 ? (
              <p className="text-sm text-green-600 mt-2">
                {produto.estoque} {produto.estoque === 1 ? 'unidade' : 'unidades'} em estoque
              </p>
            ) : (
              <p className="text-sm text-red-600 mt-2">
                Produto fora de estoque
              </p>
            )}
          </div>
        </div>
        
        {/* Product Description and Reviews */}
        <ProductDetails 
          description={produto.descricao}
          reviews={reviews}
          canReview={isAuthenticated}
          onAddReview={() => {
            if (!isAuthenticated) {
              navigate('/login', { state: { from: `/produto/${id}` } });
              return;
            }
          }}
        />
        
        {/* Back button */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleGoBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para os produtos
          </Button>
        </div>
      </main>
      
      {/* Cart popup when item is added to cart */}
      <CartPopup triggerShow={showCartPopup} />
    </div>
  );
};

export default ProdutoScreen;
