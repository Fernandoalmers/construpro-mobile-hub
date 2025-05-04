
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { addToFavorites } from '@/services/cartService';

interface ProductActionsProps {
  produto: any;
  quantidade: number;
  isFavorited: boolean;
  validateQuantity: () => void;
  isAuthenticated: boolean;
  onSuccess?: () => void; // New prop for optional callback after successful cart operation
  size?: 'default' | 'compact'; // New prop to control the size variant
}

const ProductActions: React.FC<ProductActionsProps> = ({
  produto,
  quantidade,
  isFavorited,
  validateQuantity,
  isAuthenticated,
  onSuccess,
  size = 'default',
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // Track loading state for cart operations
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isBuyingNow, setIsBuyingNow] = React.useState(false);
  
  console.log('ProductActions rendering for product:', produto.id);

  const handleAddToCart = async () => {
    validateQuantity();
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Pass the product ID, not the whole product object
      console.log('Adding to cart:', { productId: produto.id, quantity: quantidade });
      await addToCart(produto.id, quantidade);
      toast.success(`${quantidade} unidade(s) adicionada(s) ao carrinho`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      toast.error('Erro: ' + (err.message || 'Erro ao adicionar ao carrinho'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    validateQuantity();
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    setIsBuyingNow(true);
    try {
      // Pass the product ID, not the whole product object
      console.log('Buying now:', { productId: produto.id, quantity: quantidade });
      await addToCart(produto.id, quantidade);
      toast.success(`${quantidade} unidade(s) adicionada(s) ao carrinho`);
      navigate('/cart');
    } catch (err: any) {
      console.error('Error buying now:', err);
      toast.error('Erro: ' + (err.message || 'Erro ao adicionar ao carrinho'));
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }

    try {
      await addToFavorites(produto.id);
      toast.success('Produto adicionado aos favoritos');
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error('Erro ao adicionar aos favoritos');
    }
  };

  // Compact variant for product cards in list/grid views
  if (size === 'compact') {
    return (
      <div className="flex flex-col space-y-2">
        <Button 
          size="sm"
          variant="outline"
          className="w-full flex items-center justify-center bg-green-50 border-green-200 hover:bg-green-100"
          onClick={handleAddToCart}
          disabled={isAddingToCart || isBuyingNow}
        >
          {isAddingToCart ? (
            <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
          ) : (
            <ShoppingCart className="mr-1 h-4 w-4" />
          )}
          <span>Adicionar</span>
        </Button>
        
        <Button 
          size="sm" 
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={handleBuyNow}
          disabled={isAddingToCart || isBuyingNow}
        >
          {isBuyingNow ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
          ) : null}
          Comprar
        </Button>
      </div>
    );
  }

  // Default size for product detail pages
  return (
    <div className="space-y-3 mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline"
          size="lg" 
          className="w-full flex items-center justify-center"
          onClick={handleAddToCart}
          disabled={isAddingToCart || isBuyingNow}
        >
          {isAddingToCart ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full mr-2" />
          ) : (
            <ShoppingCart className="mr-2 h-5 w-5" />
          )}
          Adicionar ao Carrinho
        </Button>
        
        <Button 
          size="lg" 
          className="w-full"
          onClick={handleBuyNow}
          disabled={isAddingToCart || isBuyingNow}
        >
          {isBuyingNow ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : null}
          Comprar Agora
        </Button>
      </div>
      
      {!isFavorited && (
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-center"
          onClick={handleFavorite}
        >
          <Heart className="mr-2 h-5 w-5" />
          Adicionar aos Favoritos
        </Button>
      )}
    </div>
  );
};

export default ProductActions;
