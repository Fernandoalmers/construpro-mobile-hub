
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
    console.error('Error finding cart item:', error);
    return { item: null, error };
  }
};

/**
 * Add or update cart item
 */
export const addOrUpdateCartItem = async (cartId: string, productId: string, quantity: number, price: number) => {
  try {
    console.log('[cartItemModifiers] Adding/updating cart item:', { cartId, productId, quantity, price });
    
    // First check if item already exists
    const { item: existingItem, error: findError } = await findExistingCartItem(cartId, productId);
    
    if (findError && findError.code !== 'PGRST116') {
      console.error('[cartItemModifiers] Error checking for existing item:', findError);
      return { success: false, error: findError };
    }
    
    if (existingItem) {
      // Update existing item quantity by ADDING the new quantity
      const newQuantity = existingItem.quantity + quantity;
      console.log('[cartItemModifiers] Item exists, updating quantity from', existingItem.quantity, 'to', newQuantity);
      return await updateExistingCartItem(existingItem.id, newQuantity);
    } else {
      // Add as new item
      console.log('[cartItemModifiers] Item does not exist, adding new item');
      return await addNewCartItem(cartId, productId, quantity, price);
    }
  } catch (error) {
    console.error('Error adding/updating cart item:', error);
    return { success: false, error };
  }
};

/**
 * Add new cart item
 */
export const addNewCartItem = async (cartId: string, productId: string, quantity: number, price: number) => {
  try {
    console.log('[cartItemModifiers] Adding new cart item:', { cartId, productId, quantity, price });
    
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity,
        price_at_add: price
      })
      .select('*')
      .single();
    
    console.log('[cartItemModifiers] Insert result:', { data, error });
    
    if (error) {
      console.error('[cartItemModifiers] Error adding cart item:', error);
      
      // Additional diagnostics if insert fails
      const { data: cartCheck, error: cartCheckError } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .single();
        
      console.log('[cartItemModifiers] Cart check:', { cartCheck, cartCheckError });
      
      const { data: productCheck, error: productCheckError } = await supabase
        .from('produtos')
        .select('id')
        .eq('id', productId)
        .single();
        
      console.log('[cartItemModifiers] Product check:', { productCheck, productCheckError });
      
      return { success: false, error };
    }

    // Verify insert succeeded by querying the item back
    const { data: verifyData, error: verifyError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();
      
    console.log('[cartItemModifiers] Verification:', { verifyData, verifyError });

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
    console.log('[cartItemModifiers] Updating cart item:', { itemId, quantity });
    
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select('*')
      .single();
    
    console.log('[cartItemModifiers] Update result:', { data, error });
    
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
    console.log('[cartItemModifiers] Removing cart item:', itemId);
    
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .select('*')
      .single();
    
    console.log('[cartItemModifiers] Delete result:', { data, error });
    
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
    console.log('[cartItemModifiers] Clearing cart items for cart:', cartId);
    
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
    
    console.log('[cartItemModifiers] Clear result:', { data, error });
    
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
