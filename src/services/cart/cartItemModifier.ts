
import { supabase } from "@/integrations/supabase/client";

/**
 * Find existing cart item
 */
export const findExistingCartItem = async (cartId: string, productId: string) => {
  try {
    console.log('[cartItemModifier] Finding cart item for:', { cartId, productId });
    
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity, price_at_add')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();
    
    return { item: data, error };
  } catch (error) {
    console.error('Error finding cart item:', error);
    return { item: null, error };
  }
};

/**
 * Add new cart item
 */
export const addNewCartItem = async (cartId: string, productId: string, quantity: number, price: number) => {
  try {
    console.log('[cartItemModifier] Adding new cart item:', { cartId, productId, quantity, price });
    
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity,
        price_at_add: price
      });
    
    if (error) {
      console.error('Error adding cart item:', error);
      return { success: false, error };
    }

    // Debug verification
    const { data: verified, error: verifyError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId);
      
    console.log('[cartItemModifier] Verification result:', { data: verified, error: verifyError });
    
    return { success: true, data };
  } catch (error) {
    console.error('Error adding cart item:', error);
    return { success: false, error };
  }
};

/**
 * Update existing cart item
 */
export const updateExistingCartItem = async (itemId: string, quantity: number) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
    
    if (error) {
      console.error('Error updating cart item:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error };
  }
};

/**
 * Remove cart item
 */
export const removeCartItem = async (itemId: string) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error('Error removing cart item:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error removing cart item:', error);
    return { success: false, error };
  }
};

/**
 * Clear all items from cart
 */
export const clearCartItems = async (cartId: string) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
    
    if (error) {
      console.error('Error clearing cart items:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error clearing cart items:', error);
    return { success: false, error };
  }
};
