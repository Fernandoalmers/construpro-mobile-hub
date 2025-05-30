
import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // Use ref to track if we're already fetching to prevent multiple calls
  const fetchingRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Function to refresh cart data - stabilized with useCallback
  const refreshCart = useCallback(async () => {
    // Prevent multiple concurrent fetches
    if (fetchingRef.current) {
      console.log('[useCartState] Fetch already in progress, skipping');
      return;
    }

    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, setting empty cart');
      setCart(null);
      setIsLoading(false);
      fetchingRef.current = false;
      return;
    }
    
    fetchingRef.current = true;
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
      fetchingRef.current = false;
    }
  }, [isAuthenticated, userId, userType]); // Removed fetchCartData dependency to prevent loop

  // Load cart data on mount and when auth state changes - but prevent loops
  useEffect(() => {
    // Only run on initial load or when auth/user changes
    if (!initialLoadRef.current || fetchingRef.current) {
      initialLoadRef.current = true;
      refreshCart();
    }
  }, [isAuthenticated, userId, userType]); // Removed refreshCart from dependencies

  return {
    cart,
    isLoading,
    error,
    refreshCart
  };
}
