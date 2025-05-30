
import { useState, useCallback, useEffect, useRef } from 'react';
import { Cart } from '@/types/cart';
import { useCartFetcher } from './useCartFetcher';

/**
 * Hook to manage cart state and refreshing with performance optimizations
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
  
  // Use ref to prevent unnecessary re-renders and track last fetch
  const lastFetchRef = useRef<string>('');
  const isFetchingRef = useRef<boolean>(false);

  // Function to refresh cart data with optimization
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      console.log('[useCartState] User not authenticated, setting empty cart');
      setCart(null);
      setIsLoading(false);
      return;
    }
    
    // Create a unique key for this fetch to avoid duplicate requests
    const fetchKey = `${userId}-${userType}-${Date.now()}`;
    
    // Avoid duplicate requests if already fetching
    if (isFetchingRef.current) {
      console.log('[useCartState] Already fetching, skipping duplicate request');
      return;
    }
    
    // Check if we already fetched recently for the same user
    const currentUserKey = `${userId}-${userType}`;
    if (lastFetchRef.current === currentUserKey && cart && !isLoading) {
      console.log('[useCartState] Recent fetch detected, using cached data');
      return;
    }
    
    console.log('[useCartState] Refreshing cart for user:', userId, 'type:', userType);
    setIsLoading(true);
    isFetchingRef.current = true;
    
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
      
      // Update last fetch reference
      lastFetchRef.current = currentUserKey;
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
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, userId, userType, fetchCartData, cart, isLoading]);

  // Load cart data on mount and when auth state changes - optimized
  useEffect(() => {
    // Only refresh if user/auth state actually changed
    const currentUserKey = `${userId}-${userType}`;
    if (lastFetchRef.current !== currentUserKey) {
      refreshCart();
    }
  }, [isAuthenticated, userId, userType, refreshCart]);

  return {
    cart,
    isLoading,
    error,
    refreshCart
  };
}
