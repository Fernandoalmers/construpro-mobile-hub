
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import CartPopup from './CartPopup';

// Import our new components
import ProdutoHeader from './produto/ProdutoHeader';
import ProdutoContent from './produto/ProdutoContent';

// Import our refactored hooks
import { useProductDetails } from '@/hooks/useProductDetails';
import { useQuantityState } from '@/hooks/produto/useQuantityState';
import { useCartPopup } from '@/hooks/produto/useCartPopup';

const ProdutoScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  
  // Use our custom hooks
  const { product: produto, loading, error, isFavorited, reviews, estimatedDelivery, refetchReviews } = useProductDetails(id, isAuthenticated);
  const { showCartPopup, handleProductActionSuccess } = useCartPopup();
  const { quantidade, handleQuantityChange, validateQuantity } = useQuantityState({ 
    produto,
    defaultValue: 1
  });

  if (loading) {
    return <LoadingState text="Carregando detalhes do produto..." />;
  }

  if (error || !produto) {
    return (
      <ErrorState 
        title="Erro ao carregar produto" 
        message={error || "Produto não encontrado"}
        onRetry={() => window.location.href = '/marketplace'}
      />
    );
  }

  // Log product data for debugging
  console.log("Produto data:", produto);

  return (
    <div className="bg-gray-100 min-h-screen pb-16">
      {/* Header with search, breadcrumbs, and navigation */}
      <ProdutoHeader 
        productName={produto.nome} 
        productCategory={produto.categoria} 
        productCode={produto.sku || produto.id.substring(0, 8)}
      />

      {/* Main content */}
      <ProdutoContent 
        produto={produto}
        reviews={reviews}
        quantidade={quantidade}
        isFavorited={isFavorited}
        isAuthenticated={isAuthenticated}
        estimatedDelivery={estimatedDelivery}
        onQuantityChange={handleQuantityChange}
        validateQuantity={validateQuantity}
        onProductActionSuccess={handleProductActionSuccess}
        onReviewAdded={refetchReviews}
      />
      
      {/* Cart popup when item is added to cart */}
      <CartPopup triggerShow={showCartPopup} />
    </div>
  );
};

export default ProdutoScreen;
