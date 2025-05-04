import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, MessageCircle } from 'lucide-react';
import { Product } from '@/services/productService';
import CartPopup from '../CartPopup';
import { useCart } from '@/hooks/use-cart';

interface ProductActionsProps {
  produto: Product;
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
  isAuthenticated
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToFavorites, setAddingToFavorites] = useState(false);
  const [showCartAnimation, setShowCartAnimation] = useState(false);

  const handleAddToCart = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    validateQuantity();
    
    try {
      setAddingToCart(true);
      await addToCart(produto.id, quantidade);
      
      // Show animation and toast
      setShowCartAnimation(true);
      toast.success(`${produto.nome} adicionado ao carrinho`);
      
      // Hide animation after 3 seconds
      setTimeout(() => {
        setShowCartAnimation(false);
      }, 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };
  
  const handleBuyNow = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    validateQuantity();
    
    try {
      setAddingToCart(true);
      await addToCart(produto.id, quantidade);
      // Navigate directly to cart page after adding product
      navigate('/cart');
    } catch (err) {
      console.error('Error in buy now:', err);
      toast.error('Erro ao processar compra');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!produto?.id) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    try {
      setAddingToFavorites(true);
      if (!isFavorited) {
        // Keep existing favorite functionality
        const { addToFavorites } = await import('@/services/cartService');
        const result = await addToFavorites(produto.id);
        
        if (result) {
          toast.success(`${produto.nome} adicionado aos favoritos`);
        } else {
          toast.error('Erro ao adicionar aos favoritos');
        }
      } else {
        // For now just show a success message as we're not implementing remove yet
        toast.info('Produto já está nos favoritos');
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
      toast.error('Erro ao modificar favoritos');
    } finally {
      setAddingToFavorites(false);
    }
  };
  
  const handleChatWithStore = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/produto/${produto.id}` } });
      return;
    }
    
    // In a full implementation, this would open a chat with the store
    toast.info('Funcionalidade de chat em desenvolvimento');
  };

  return (
    <>
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex items-center gap-2">
          <Button 
            className="flex-1 gap-2" 
            onClick={handleAddToCart}
            disabled={addingToCart}
          >
            <ShoppingCart size={18} />
            Adicionar ao Carrinho
          </Button>
          <Button 
            variant="outline" 
            className={`aspect-square p-0 ${isFavorited ? 'text-red-500 border-red-500' : ''}`}
            onClick={handleToggleFavorite}
            disabled={addingToFavorites}
          >
            <Heart size={18} className={isFavorited ? "fill-red-500" : ""} />
          </Button>
        </div>
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={handleBuyNow}
          disabled={addingToCart}
        >
          Comprar Agora
        </Button>
        {produto.stores?.id && (
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleChatWithStore}
          >
            <MessageCircle size={18} />
            Chat com a Loja
          </Button>
        )}
      </div>
      
      {/* Show cart animation popup when item is added to cart */}
      {showCartAnimation && <CartPopup />}
    </>
  );
};

export default ProductActions;
