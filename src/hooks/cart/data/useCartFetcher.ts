
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
    try {
      if (!userId) {
        console.log('[useCartFetcher] Skipping cart fetch - user not authenticated');
        return null;
      }

      console.log('[useCartFetcher] Fetching cart data for user:', userId, 'type:', userType);
      
      try {
        // First, try to get an existing active cart - simplified query
        const { data: existingCarts, error: cartError } = await supabase
          .from('carts')
          .select('id, user_id, created_at')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5); // Only get a few carts to check
          
        if (cartError) {
          console.error('[useCartFetcher] Error fetching carts:', cartError);
          return createEmptyCart(userId);
        }

        let activeCartId: string;

        if (!existingCarts || existingCarts.length === 0) {
          // No active cart found, create one
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
        } else if (existingCarts.length === 1) {
          // Perfect - one active cart
          activeCartId = existingCarts[0].id;
          console.log('[useCartFetcher] Found single active cart:', activeCartId);
        } else {
          // Multiple active carts - use most recent, archive others in background
          activeCartId = existingCarts[0].id;
          console.log('[useCartFetcher] Multiple carts found, using most recent:', activeCartId);
          
          // Archive other carts in background (non-blocking)
          const cartsToArchive = existingCarts.slice(1).map(c => c.id);
          if (cartsToArchive.length > 0) {
            // Don't await this - let it run in background
            supabase
              .from('carts')
              .update({ status: 'abandoned' })
              .in('id', cartsToArchive)
              .then(() => console.log('[useCartFetcher] Archived old carts in background'))
              .catch(err => console.warn('[useCartFetcher] Background archiving failed:', err));
          }
        }

        // Process cart items and return the complete cart
        return await processCartItems(activeCartId, userId, userType);
      } catch (innerErr: any) {
        console.error('[useCartFetcher] Error in fetchCartData:', innerErr);
        // Return empty cart on error to avoid infinite loading
        return createEmptyCart(userId);
      }
    } catch (err: any) {
      console.error('[useCartFetcher] Error in fetchCartData outer try/catch:', err);
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
    items: [],
    summary: {
      subtotal: 0,
      shipping: 0,
      totalItems: 0,
      totalPoints: 0
    }
  };
};
