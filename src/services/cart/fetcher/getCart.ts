
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';
import { ensureSingleActiveCart } from '../consolidation/consolidateActiveCart';
import { processCartItems } from './processCartItems';

/**
 * Get the active cart for the current user
 */
export const getCart = async (): Promise<Cart | null> => {
  try {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      console.log('[getCart] User not authenticated');
      return null;
    }
    
    const userId = userData.user.id;
    console.log('[getCart] Fetching cart for user:', userId);

    try {
      // Ensure there is only one active cart for this user
      console.log('[getCart] Ensuring single active cart');
      const activeCartId = await ensureSingleActiveCart(userId);
      
      if (!activeCartId) {
        console.log('[getCart] No active cart found or could not be created');
        return createEmptyCart(userId);
      }

      console.log('[getCart] Using active cart:', activeCartId);

      // Fetch cart using the guaranteed single active cart ID
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id, user_id')
        .eq('id', activeCartId)
        .eq('status', 'active')
        .single();

      if (cartError) {
        console.error('[getCart] Error fetching cart:', cartError);
        // Return empty cart instead of throwing
        return createEmptyCart(userId);
      }

      // Fetch and process the items for this cart
      const processedCart = await processCartItems(cart.id, cart.user_id);
      return processedCart;
    } catch (innerErr: any) {
      console.error('[getCart] Inner error:', innerErr);
      // Return empty cart on error to avoid infinite loading
      return createEmptyCart(userId);
    }
  } catch (error: any) {
    console.error('[getCart] Error:', error);
    return null;
  }
};

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
      totalItems: 0,
      totalPoints: 0
    }
  };
};
