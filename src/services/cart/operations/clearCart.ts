
import { supabase } from "@/integrations/supabase/client";
import { clearCartItems } from "./cartItemModifiers";

/**
 * Clear cart
 */
export const clearCart = async (): Promise<boolean> => {
  try {
    console.log('[clearCart] Clearing cart');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (cartError || !cart) {
      console.error('Error finding active cart:', cartError);
      return false;
    }

    // Clear all items from cart
    const { success } = await clearCartItems(cart.id);
    return success;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};
