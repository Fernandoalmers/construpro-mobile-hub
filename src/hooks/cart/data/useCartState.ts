
import { useState, useCallback, useEffect, useRef } from 'react';
import { Cart } from '@/types/cart';
import { useCartFetcher } from './useCartFetcher';

/**
 * Hook to manage cart state - fixed to prevent infinite loops
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
  const lastAuthState = useRef<{isAuth: boolean, userId: string | null}>({
    isAuth: false,
    userId: null
  });

  console.log('[useCartState] Current state:', { 
    isAuthenticated, 
    userId, 
    userType, 
    isLoading,
    cartItems: cart?.items?.length || 0
  });

  // Create a stable refresh function
  const refreshCart = useCallback(async () => {
    console.log('[useCartState] refreshCart called:', { isAuthenticated, userId });
    
    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, setting empty cart');
      setCart(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    try {
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

  // Initialize cart only when auth state changes significantly
  useEffect(() => {
    const currentAuthState = { isAuth: isAuthenticated, userId };
    const lastState = lastAuthState.current;
    
    console.log('[useCartState] Auth effect:', { 
      current: currentAuthState, 
      last: lastState,
      hasChanged: currentAuthState.isAuth !== lastState.isAuth || currentAuthState.userId !== lastState.userId
    });
    
    // Only refresh if auth state actually changed or first time
    if (!isInitialized.current || 
        currentAuthState.isAuth !== lastState.isAuth || 
        currentAuthState.userId !== lastState.userId) {
      
      console.log('[useCartState] Auth state changed, refreshing cart');
      lastAuthState.current = currentAuthState;
      isInitialized.current = true;
      
      refreshCart();
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
