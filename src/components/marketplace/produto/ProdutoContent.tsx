
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productService';
import { ProductReview } from '@/hooks/product/useProductReviews';

// Import our components
import ProductImageGallery from '../components/ProductImageGallery';
import ProductInfo from '../components/ProductInfo';
import ProductDetails from '../components/ProductDetails';
import QuantitySelector from '../components/QuantitySelector';
import ProductActions from '../components/ProductActions';

interface ProdutoContentProps {
  produto: Product;
  reviews: ProductReview[];
  quantidade: number;
  isFavorited: boolean;
  isAuthenticated: boolean;
  estimatedDelivery: {
    minDays: number;
    maxDays: number;
  };
  onQuantityChange: (delta: number) => void;
  validateQuantity: () => void;
  onProductActionSuccess: () => void;
}

const ProdutoContent: React.FC<ProdutoContentProps> = ({
  produto,
  reviews,
  quantidade,
  isFavorited,
  isAuthenticated,
  estimatedDelivery,
  onQuantityChange,
  validateQuantity,
  onProductActionSuccess
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1); // Navigate to previous page
  };

  const hasDiscount = (produto.preco_anterior || 0) > (produto.preco || 0);
  const discountPercentage = hasDiscount 
    ? Math.round(((produto.preco_anterior - produto.preco) / produto.preco_anterior) * 100)
    : 0;

  return (
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
            onQuantityChange={onQuantityChange}
          />
          
          {/* Product Actions */}
          <ProductActions
            produto={produto}
            quantidade={quantidade}
            isFavorited={isFavorited}
            validateQuantity={validateQuantity}
            isAuthenticated={isAuthenticated}
            onSuccess={onProductActionSuccess}
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
            navigate('/login', { state: { from: `/produto/${produto.id}` } });
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
  );
};

export default ProdutoContent;
