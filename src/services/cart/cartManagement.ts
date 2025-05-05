
import { supabase } from "@/integrations/supabase/client";

/**
 * Create a new cart for the user
 */
export const createCart = async (userId: string): Promise<string | null> => {
  try {
    // Create a new cart
    const { data: cart, error } = await supabase
      .from('carts')
      .insert({ 
        user_id: userId,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating cart:', error);
      return null;
    }

    return cart.id;
  } catch (error) {
    console.error('Error in createCart:', error);
    return null;
  }
};

/**
 * Clear cart items and mark the cart as cleared/inactive
 */
export const clearCart = async (): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Get active cart
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return false;
    }

    // Delete all cart items
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartData.id);

    if (deleteError) {
      console.error('Error clearing cart:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};
