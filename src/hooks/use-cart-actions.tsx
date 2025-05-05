
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
    // Set loading state at the beginning
    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));
    
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
      // Important: Always reset loading state, even on error
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Buy now function - adds to cart then immediately navigates to cart
  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    // Set loading state at the beginning
    setIsBuyingNow(prev => ({ ...prev, [productId]: true }));
    
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
      
      // Added this for debugging
      console.log('Before addToCart call in handleBuyNow');
      
      // Use direct call to addToCart instead of handleAddToCart to avoid nested states
      const success = await handleAddToCart(productId, quantity);
      
      console.log('Add to cart result:', success);
      
      if (success) {
        console.log('Successfully added to cart, navigating to /cart');
        navigate('/cart');
      }
    } catch (error: any) {
      console.error('Error buying now:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao processar compra'));
    } finally {
      // Important: Always reset loading state, even on error
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
