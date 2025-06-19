
import { useState, useCallback, useEffect, useRef } from 'react';
import { Cart } from '@/types/cart';
import { useCartFetcher } from './useCartFetcher';

/**
 * Hook to manage cart state - optimized to prevent infinite loops
 */
export function useCartState(
  isAuthenticated: boolean, 
  userId: string | null,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  const { fetchCartData } = useCartFetcher();
  const isInitialized = useRef(false);
  const refreshInProgress = useRef(false);

  console.log('[useCartState] Current state:', { 
    isAuthenticated, 
    userId, 
    userType, 
    isLoading,
    cartItems: cart?.items?.length || 0,
    refreshInProgress: refreshInProgress.current
  });

  // Create a stable refresh function
  const refreshCart = useCallback(async () => {
    // Prevent concurrent refresh calls
    if (refreshInProgress.current) {
      console.log('[useCartState] Refresh already in progress, skipping');
      return;
    }

    console.log('[useCartState] refreshCart called:', { isAuthenticated, userId });
    
    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, setting empty cart');
      setCart(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    try {
      refreshInProgress.current = true;
      setIsLoading(true);
      setError(null);
      
      const cartData = await fetchCartData(userId, userType);
      console.log('[useCartState] Fetched cart data:', { 
        cartId: cartData?.id, 
        itemCount: cartData?.items?.length || 0 
      });
      
      if (!cartData || !cartData.items || cartData.items.length === 0) {
        const emptyCart: Cart = {
          id: cartData?.id || '',
          user_id: userId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [],
          summary: {
            subtotal: 0,
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
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
        summary: {
          subtotal: 0,
          totalItems: 0,
          totalPoints: 0
        }
      });
    } finally {
      setIsLoading(false);
      refreshInProgress.current = false;
    }
  }, [isAuthenticated, userId, userType, fetchCartData]);

  // Initialize cart only once when authenticated
  useEffect(() => {
    if (isAuthenticated && userId && !isInitialized.current && !refreshInProgress.current) {
      console.log('[useCartState] Initializing cart for authenticated user');
      isInitialized.current = true;
      refreshCart();
    } else if (!isAuthenticated) {
      console.log('[useCartState] User not authenticated, resetting state');
      isInitialized.current = false;
      setCart(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, userId, refreshCart]);

  return {
    cart,
    isLoading,
    error,
    refreshCart,
    refreshKey
  };
}
