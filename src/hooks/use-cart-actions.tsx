
import { useState, useCallback } from 'react';
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
    if (!productId) {
      console.error('[useCartActions] Invalid product ID:', productId);
      toast.error('Erro: ID do produto inválido');
      return false;
    }

    console.log('[useCartActions] handleAddToCart called with:', { productId, quantity });
    
    // Check authentication first before setting loading state
    if (!isAuthenticated) {
      console.log('[useCartActions] User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${productId}` } });
      return false;
    }

    // Set loading state at the beginning and make sure it gets cleared in finally block
    setIsAddingToCart(prev => ({ ...prev, [productId]: true }));
    
    try {
      console.log('[useCartActions] Calling addToCart with:', { productId, quantity });
      await addToCart(productId, quantity);
      
      // Refresh cart to make sure the UI updates
      console.log('[useCartActions] Product added to cart, refreshing cart data');
      await refreshCart();
      
      toast.success(`${quantity} unidade(s) adicionada(s) ao carrinho`);
      return true;
    } catch (error: any) {
      console.error('[useCartActions] Error adding to cart:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      return false;
    } finally {
      // Important: Always reset loading state, even on error
      setIsAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Buy now function - adds to cart then immediately navigates to cart
  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    if (!productId) {
      console.error('[useCartActions] Invalid product ID:', productId);
      toast.error('Erro: ID do produto inválido');
      return;
    }

    console.log('[useCartActions] handleBuyNow called with:', { productId, quantity });
    
    // Check authentication first before setting loading state
    if (!isAuthenticated) {
      console.log('[useCartActions] User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${productId}` } });
      return;
    }

    // Set buying state
    setIsBuyingNow(prev => ({ ...prev, [productId]: true }));
    
    try {
      console.log('[useCartActions] Adding to cart with:', { productId, quantity });
      // Use the handleAddToCart function to avoid duplication
      const success = await handleAddToCart(productId, quantity);
      
      if (success) {
        console.log('[useCartActions] Successfully added to cart, navigating to /cart');
        // Navigate to cart page
        navigate('/cart');
      } else {
        console.log('[useCartActions] Failed to add to cart, not navigating');
      }
    } catch (error: any) {
      console.error('[useCartActions] Error buying now:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao processar compra'));
    } finally {
      // Important: Reset buying state regardless of outcome
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
