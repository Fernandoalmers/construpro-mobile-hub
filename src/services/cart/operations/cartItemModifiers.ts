
import { supabase } from "@/integrations/supabase/client";

/**
 * Find existing cart item
 */
export const findExistingCartItem = async (cartId: string, productId: string) => {
  try {
    console.log('[cartItemModifiers] Finding cart item for:', { cartId, productId });
    
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity, price_at_add')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();
    
    console.log('[cartItemModifiers] Find result:', { data, error });
    return { item: data, error };
  } catch (error) {
    console.error('[cartItemModifiers] Error finding cart item:', error);
    return { item: null, error };
  }
};

/**
 * Add or update a cart item
 * This handles both adding a new item or updating the quantity of an existing item
 */
export const addOrUpdateCartItem = async (cartId: string, productId: string, quantity: number, price: number): Promise<{ success: boolean, error: any }> => {
  try {
    console.log('[cartItemModifiers] Adding or updating cart item:', { cartId, productId, quantity, price });
    
    // First check if the item already exists in the cart
    const { item: existingItem, error: findError } = await findExistingCartItem(cartId, productId);
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('[cartItemModifiers] Error finding existing item:', findError);
      return { success: false, error: findError };
    }
    
    if (existingItem) {
      // Update existing item quantity
      console.log(`[cartItemModifiers] Found existing item ${existingItem.id}, updating quantity from ${existingItem.quantity} to ${existingItem.quantity + quantity}`);
      
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select('*')
        .single();
      
      if (error) {
        console.error('[cartItemModifiers] Error updating cart item:', error);
        return { success: false, error };
      }
      
      console.log('[cartItemModifiers] Successfully updated cart item:', data);
      return { success: true, error: null };
    } else {
      // Add new item
      console.log('[cartItemModifiers] No existing item found, adding new item');
      
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity: quantity,
          price_at_add: price
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('[cartItemModifiers] Error adding cart item:', error);
        return { success: false, error };
      }
      
      console.log('[cartItemModifiers] Successfully added new cart item:', data);
      return { success: true, error: null };
    }
  } catch (error) {
    console.error('[cartItemModifiers] Error in addOrUpdateCartItem:', error);
    return { success: false, error };
  }
};

/**
 * Update an existing cart item's quantity
 */
export const updateExistingCartItem = async (itemId: string, quantity: number): Promise<{ success: boolean, error: any }> => {
  try {
    console.log('[cartItemModifiers] Updating cart item quantity:', { itemId, quantity });
    
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select('*')
      .single();
    
    if (error) {
      console.error('[cartItemModifiers] Error updating cart item:', error);
      return { success: false, error };
    }
    
    console.log('[cartItemModifiers] Successfully updated cart item:', data);
    return { success: true, error: null };
  } catch (error) {
    console.error('[cartItemModifiers] Error updating cart item:', error);
    return { success: false, error };
  }
};

/**
 * Remove a cart item
 */
export const removeCartItem = async (itemId: string): Promise<{ success: boolean, error: any }> => {
  try {
    console.log('[cartItemModifiers] Removing cart item:', itemId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      console.error('[cartItemModifiers] Error removing cart item:', error);
      return { success: false, error };
    }
    
    console.log('[cartItemModifiers] Successfully removed cart item');
    return { success: true, error: null };
  } catch (error) {
    console.error('[cartItemModifiers] Error removing cart item:', error);
    return { success: false, error };
  }
};

/**
 * Clear all items from a cart
 */
export const clearCartItems = async (cartId: string): Promise<{ success: boolean, error: any }> => {
  try {
    console.log('[cartItemModifiers] Clearing all items from cart:', cartId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
    
    if (error) {
      console.error('[cartItemModifiers] Error clearing cart items:', error);
      return { success: false, error };
    }
    
    console.log('[cartItemModifiers] Successfully cleared all cart items');
    return { success: true, error: null };
  } catch (error) {
    console.error('[cartItemModifiers] Error clearing cart items:', error);
    return { success: false, error };
  }
};
