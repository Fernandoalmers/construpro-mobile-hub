
import { useState, useCallback, useEffect } from 'react';
import { Cart } from '@/types/cart';
import { useCartFetcher } from './useCartFetcher';

/**
 * Hook to manage cart state and refreshing
 */
export function useCartState(
  isAuthenticated: boolean, 
  userId: string | null,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { fetchCartData } = useCartFetcher();

  // Function to refresh cart data
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, setting empty cart');
      setCart(null);
      setIsLoading(false);
      return;
    }
    
    console.log('[useCartState] Refreshing cart for user:', userId, 'type:', userType);
    setIsLoading(true);
    
    try {
      const cartData = await fetchCartData(userId, userType);
      
      // Force empty cart if no items found
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        console.log('[useCartState] No cart items found, setting empty cart');
        const emptyCart: Cart = {
          id: cartData?.id || '',
          user_id: userId,
          items: [],
          summary: {
            subtotal: 0,
            shipping: 0,
            totalItems: 0,
            totalPoints: 0
          }
        };
        setCart(emptyCart);
      } else {
        console.log('[useCartState] Cart data loaded with', cartData.items.length, 'items');
        setCart(cartData);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('[useCartState] Error refreshing cart:', err);
      setError(err);
      // Set cart to empty object rather than null to prevent loading state issues
      setCart({
        id: '',
        user_id: userId,
        items: [],
        summary: {
          subtotal: 0,
          shipping: 0,
          totalItems: 0,
          totalPoints: 0
        }
      });
    } finally {
      // Always ensure loading state is completed
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, userType, fetchCartData]);

  // Load cart data on mount and when auth state changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart, isAuthenticated, userId, userType]);

  return {
    cart,
    isLoading,
    error,
    refreshCart
  };
}
