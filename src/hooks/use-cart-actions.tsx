
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from './use-cart';

export function useCartActions() {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});
  const [isBuyingNow, setIsBuyingNow] = useState<Record<string, boolean>>({});

  // Add to cart function - properly handles authentication and updates state
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { state: { from: `/produto/${productId}` } });
        return false;
      }
      
      setIsAddingToCart(prev => ({ ...prev, [productId]: true }));
      await addToCart(productId, quantity);
      toast.success(`${quantity} unidade(s) adicionada(s) ao carrinho`);
      return true;
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      return false;
    } finally {
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Buy now function - adds to cart then immediately navigates to cart
  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { state: { from: `/produto/${productId}` } });
        return;
      }
      
      setIsBuyingNow(prev => ({ ...prev, [productId]: true }));
      const success = await handleAddToCart(productId, quantity);
      
      if (success) {
        navigate('/cart');
      }
    } finally {
      setIsBuyingNow(prev => ({ ...prev, [productId]: false }));
    }
  };

  return {
    handleAddToCart,
    handleBuyNow,
    isAddingToCart,
    isBuyingNow
  };
}
