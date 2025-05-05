
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from './use-cart';

export function useCartActions() {
  const { addToCart, refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});
  const [isBuyingNow, setIsBuyingNow] = useState<Record<string, boolean>>({});

  // Add to cart function - properly handles authentication and updates state
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    try {
      console.log('handleAddToCart called with:', { productId, quantity });
      
      if (!productId) {
        console.error('Invalid product ID:', productId);
        toast.error('Erro: ID do produto inválido');
        return false;
      }

      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { state: { from: `/produto/${productId}` } });
        return false;
      }
      
      // Set loading state
      setIsAddingToCart(prev => ({ ...prev, [productId]: true }));
      
      console.log('Calling addToCart with:', { productId, quantity });
      await addToCart(productId, quantity);
      
      // Refresh cart to make sure the UI updates
      await refreshCart();
      
      toast.success(`${quantity} unidade(s) adicionada(s) ao carrinho`);
      return true;
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      return false;
    } finally {
      // Always reset loading state, even on error
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Buy now function - adds to cart then immediately navigates to cart
  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    try {
      console.log('handleBuyNow called with:', { productId, quantity });
      
      if (!productId) {
        console.error('Invalid product ID:', productId);
        toast.error('Erro: ID do produto inválido');
        return;
      }

      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { state: { from: `/produto/${productId}` } });
        return;
      }
      
      // Set loading state
      setIsBuyingNow(prev => ({ ...prev, [productId]: true }));
      
      // Attempt to add to cart first
      const success = await handleAddToCart(productId, quantity);
      
      if (success) {
        console.log('Successfully added to cart, navigating to /cart');
        navigate('/cart');
      } else {
        console.error('Failed to add product to cart');
        toast.error('Não foi possível adicionar o produto ao carrinho.');
      }
    } catch (error: any) {
      console.error('Error buying now:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao processar compra'));
    } finally {
      // Always reset loading state, even on error
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
