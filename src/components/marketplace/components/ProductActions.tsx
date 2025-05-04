
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
}

const ProductActions: React.FC<ProductActionsProps> = ({
  produto,
  quantidade,
  isFavorited,
  validateQuantity,
  isAuthenticated,
}) => {
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  
  // Added console log to verify this new implementation is being used
  console.log('ProductActions component loaded - updated implementation');
  console.log('Product being viewed:', produto);
  console.log('Authentication status:', isAuthenticated);

  const handleAddToCart = () => {
    validateQuantity();
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    // Pass the product ID, not the whole product object
    console.log('Adding to cart:', { productId: produto.id, quantity: quantidade });
    addToCart(produto.id, quantidade)
      .catch(err => toast.error('Erro: ' + (err.message || 'Erro ao adicionar ao carrinho')));
    toast.success(`${quantidade} unidade(s) adicionada(s) ao carrinho`);
  };

  const handleBuyNow = () => {
    validateQuantity();
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    // Pass the product ID, not the whole product object
    console.log('Buying now:', { productId: produto.id, quantity: quantidade });
    addToCart(produto.id, quantidade)
      .then(() => navigate('/cart'))
      .catch(err => toast.error('Erro: ' + (err.message || 'Erro ao adicionar ao carrinho')));
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

  return (
    <div className="space-y-3 mt-6">
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline"
          size="lg" 
          className="w-full flex items-center justify-center"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Adicionar ao Carrinho
        </Button>
        
        <Button 
          size="lg" 
          className="w-full"
          onClick={handleBuyNow}
        >
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
