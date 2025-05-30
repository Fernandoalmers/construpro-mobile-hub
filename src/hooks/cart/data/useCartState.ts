
import { useState, useCallback, useEffect, useRef } from 'react';
import { Cart } from '@/types/cart';
import { useCartFetcher } from './useCartFetcher';

/**
 * Hook to manage cart state - simplified to prevent infinite loops
 */
export function useCartState(
  isAuthenticated: boolean, 
  userId: string | null,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  const { fetchCartData } = useCartFetcher();
  const isInitialized = useRef(false);

  // Create a stable refresh function that doesn't cause re-renders
  const refreshCart = useCallback(async () => {
    console.log('[useCartState] Refreshing cart data');
    
    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, clearing cart');
      setCart(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await fetchCartData(userId, userType);
      
      if (!cartData || !cartData.items || cartData.items.length === 0) {
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
        setCart(cartData);
      }
      
      setRefreshKey(prev => prev + 1);
      
    } catch (err: any) {
      console.error('[useCartState] Error refreshing cart:', err);
      setError(err);
      
      // Set empty cart on error
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
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, userType, fetchCartData]);

  // Simple initialization - only run once when auth state changes
  useEffect(() => {
    console.log('[useCartState] Auth state effect:', { isAuthenticated, userId, userType });
    
    // Reset initialization when user changes
    if (!isInitialized.current || !isAuthenticated || !userId) {
      isInitialized.current = true;
      refreshCart();
    }
  }, [isAuthenticated, userId]); // Minimal dependencies to prevent loops

  return {
    cart,
    isLoading,
    error,
    refreshCart,
    refreshKey
  };
}
