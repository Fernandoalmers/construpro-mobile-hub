
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
      // Simplified cart lookup - get or create active cart
      const { data: existingCarts, error: cartError } = await supabase
        .from('carts')
        .select('id, user_id, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3); // Limit to reduce query time
          
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
        
        // Archive other carts in background if needed (non-blocking)
        if (existingCarts.length > 1) {
          const cartsToArchive = existingCarts.slice(1).map(c => c.id);
          // Don't block the main flow for this cleanup
          setTimeout(() => {
            supabase
              .from('carts')
              .update({ status: 'abandoned' })
              .in('id', cartsToArchive)
              .then(({ error }) => {
                if (!error) {
                  console.log('[useCartFetcher] Archived old carts in background');
                }
              });
          }, 100);
        }
      }

      // Process cart items with timeout to prevent hanging
      const timeoutPromise = new Promise<Cart>((_, reject) => {
        setTimeout(() => reject(new Error('Cart processing timeout')), 10000); // 10 second timeout
      });

      const cartPromise = processCartItems(activeCartId, userId, userType);
      
      try {
        const processedCart = await Promise.race([cartPromise, timeoutPromise]);
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
    items: [],
    summary: {
      subtotal: 0,
      shipping: 0,
      totalItems: 0,
      totalPoints: 0
    }
  };
};
