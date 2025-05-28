
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';
import { ensureSingleActiveCart } from '@/services/cart/cartConsolidation';
import { processCartItems } from '@/services/cart/fetcher';

/**
 * Hook to fetch cart data from the database
 */
export function useCartFetcher() {
  // Function to fetch cart data from the database
  const fetchCartData = useCallback(async (
    userId: string | null, 
    userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
  ): Promise<Cart | null> => {
    try {
      if (!userId) {
        console.log('Skipping cart fetch - user not authenticated');
        return null;
      }

      console.log('Fetching cart data for user:', userId, 'type:', userType);
      
      try {
        // Ensure there is only one active cart for this user
        const activeCartId = await ensureSingleActiveCart(userId);
        
        if (!activeCartId) {
          console.log('No active cart found or created for user');
          return createEmptyCart(userId);
        }

        // Fetch cart with the active cart ID
        const { data: cart, error: cartError } = await supabase
          .from('carts')
          .select('id, user_id, created_at')
          .eq('id', activeCartId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors
          
        if (cartError || !cart) {
          console.error('[useCartFetcher] Error or no cart found:', cartError);
          // Return empty cart instead of throwing error
          return createEmptyCart(userId);
        }

        // Process cart items and return the complete cart with user type
        return await processCartItems(cart.id, userId, userType);
      } catch (innerErr: any) {
        console.error('Error in fetchCartData:', innerErr);
        // Return empty cart on error to avoid infinite loading
        return createEmptyCart(userId);
      }
    } catch (err: any) {
      console.error('Error in fetchCartData outer try/catch:', err);
      return createEmptyCart(userId);
    }
  }, []);

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
