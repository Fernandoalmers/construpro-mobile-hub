
import { useState, useCallback, useEffect, useRef } from 'react';
import { Cart } from '@/types/cart';
import { useCartFetcher } from './useCartFetcher';

/**
 * Hook to manage cart state with improved synchronization
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
  
  // Use refs to track loading state and prevent multiple concurrent calls
  const isInitialized = useRef(false);
  const isFetching = useRef(false);

  // Function to refresh cart data
  const refreshCart = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetching.current) {
      console.log('[useCartState] Skipping refresh - already fetching');
      return;
    }

    // Handle unauthenticated state immediately
    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, setting empty cart');
      setCart(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    isFetching.current = true;
    console.log('[useCartState] Starting cart refresh for user:', userId);
    
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await fetchCartData(userId, userType);
      console.log('[useCartState] Cart data fetched:', {
        hasData: !!cartData,
        itemCount: cartData?.items?.length || 0,
        cartId: cartData?.id
      });
      
      // Always set cart data, even if empty
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
      
      // Update refresh key to trigger UI updates
      setRefreshKey(prev => prev + 1);
      
    } catch (err: any) {
      console.error('[useCartState] Error refreshing cart:', err);
      setError(err);
      // Set empty cart on error to prevent loading loops
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
      isFetching.current = false;
      console.log('[useCartState] Cart refresh completed');
    }
  }, [isAuthenticated, userId, userType, fetchCartData]);

  // Simple initialization effect - runs only when auth state changes
  useEffect(() => {
    console.log('[useCartState] Auth state changed:', { isAuthenticated, userId, userType });
    // Reset initialization flag when user changes
    isInitialized.current = false;
    
    // Only fetch if not already initialized
    if (!isInitialized.current) {
      console.log('[useCartState] Initializing cart data fetch');
      isInitialized.current = true;
      refreshCart();
    }
  }, [userId, isAuthenticated, userType, refreshCart]);

  return {
    cart,
    isLoading,
    error,
    refreshCart,
    refreshKey
  };
}
