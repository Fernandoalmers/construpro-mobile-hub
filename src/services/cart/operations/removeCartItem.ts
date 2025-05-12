
import { supabase } from "@/integrations/supabase/client";
import { removeCartItem } from "./cartItemModifiers";
import { ensureSingleActiveCart } from "../cartConsolidation";

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<boolean> => {
  try {
    console.log('[removeCartItem] Removing item from cart:', itemId);
    
    if (!itemId) {
      console.error('Invalid item ID');
      return false;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Ensure we have a single active cart
    await ensureSingleActiveCart(userData.user.id);

    // Remove the item
    const { success, error } = await removeCartItem(itemId);
    if (!success) {
      console.error('Error removing item:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};
