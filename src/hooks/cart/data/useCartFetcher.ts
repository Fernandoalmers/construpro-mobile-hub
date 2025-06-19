
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';
import { processCartItems } from '@/services/cart/fetcher';

/**
 * Hook to fetch cart data from the database - optimized version
 */
export function useCartFetcher() {
  // Function to fetch cart data from the database
  const fetchCartData = useCallback(async (
    userId: string | null, 
    userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
  ): Promise<Cart | null> => {
    if (!userId) {
      console.log('[useCartFetcher] Skipping cart fetch - user not authenticated');
      return createEmptyCart('');
    }

    console.log('[useCartFetcher] Fetching cart data for user:', userId, 'type:', userType);
    
    try {
      // Simplified cart lookup - get or create active cart quickly
      const { data: existingCarts, error: cartError } = await supabase
        .from('carts')
        .select('id, user_id, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1); // Only get the most recent one
          
      if (cartError) {
        console.error('[useCartFetcher] Error fetching carts:', cartError);
        return createEmptyCart(userId);
      }

      let activeCartId: string;

      if (!existingCarts || existingCarts.length === 0) {
        // No active cart found, create one quickly
        console.log('[useCartFetcher] No active cart found, creating new one');
        
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: userId, status: 'active' })
          .select('id')
          .single();
            
        if (createError) {
          console.error('[useCartFetcher] Error creating new cart:', createError);
          return createEmptyCart(userId);
        }
        
        activeCartId = newCart.id;
        console.log('[useCartFetcher] Created new cart:', activeCartId);
      } else {
        // Use the most recent cart
        activeCartId = existingCarts[0].id;
        console.log('[useCartFetcher] Found active cart:', activeCartId);
      }

      // Process cart items with increased timeout
      const timeoutPromise = new Promise<Cart>((_, reject) => {
        setTimeout(() => reject(new Error('Cart processing timeout')), 30000); // Increased to 30 seconds
      });

      const cartPromise = processCartItems(activeCartId, userId, userType);
      
      try {
        const processedCart = await Promise.race([cartPromise, timeoutPromise]);
        console.log('[useCartFetcher] Cart processing completed successfully');
        return processedCart;
      } catch (timeoutError) {
        console.warn('[useCartFetcher] Cart processing timed out, returning empty cart');
        return createEmptyCart(userId);
      }

    } catch (err: any) {
      console.error('[useCartFetcher] Error in fetchCartData:', err);
      return createEmptyCart(userId);
    }
  }, []); // No dependencies to prevent recreation

  return { fetchCartData };
}

/**
 * Create an empty cart object for the given user ID
 */
const createEmptyCart = (userId: string): Cart => {
  return {
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
  };
};
