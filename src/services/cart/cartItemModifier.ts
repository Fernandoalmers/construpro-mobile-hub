
import { supabase } from "@/integrations/supabase/client";

/**
 * Add a new item to the cart
 */
export const addNewCartItem = async (
  cartId: string,
  productId: string,
  quantity: number,
  price: number
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('[cartItemModifier] Adding new item to cart:', cartId, productId, quantity, price);
    
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity: quantity,
        price_at_add: price
      });

    if (insertError) {
      console.error('Error adding item to cart:', insertError);
      return { 
        success: false, 
        error: insertError 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in addNewCartItem:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Update the quantity of an existing cart item
 */
export const updateExistingCartItem = async (
  itemId: string,
  newQuantity: number
): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('[cartItemModifier] Updating cart item quantity:', itemId, 'to:', newQuantity);
    
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error updating cart item:', updateError);
      return { 
        success: false, 
        error: updateError 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateExistingCartItem:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Find an existing item in the cart
 */
export const findExistingCartItem = async (
  cartId: string,
  productId: string
): Promise<{ item?: any; error?: any }> => {
  try {
    console.log('[cartItemModifier] Checking for existing cart item in cart', cartId, 'for product', productId);
    
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingItemError && existingItemError.code !== 'PGRST116') {
      console.error('Error checking for existing item:', existingItemError);
      return { error: existingItemError };
    }

    return { item: existingItem };
  } catch (error) {
    console.error('Error in findExistingCartItem:', error);
    return { error };
  }
};

/**
 * Remove a cart item
 */
export const removeCartItem = async (itemId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('[cartItemModifier] Removing item from cart:', itemId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error removing cart item:', error);
      return { 
        success: false, 
        error 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    return { 
      success: false, 
      error 
    };
  }
};

/**
 * Clear all items from a cart
 */
export const clearCartItems = async (cartId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    console.log('[cartItemModifier] Clearing items from cart:', cartId);
    
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (deleteError) {
      console.error('Error clearing cart:', deleteError);
      return { 
        success: false, 
        error: deleteError 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in clearCartItems:', error);
    return { 
      success: false, 
      error 
    };
  }
};
