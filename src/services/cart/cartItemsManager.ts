
import { supabase } from "@/integrations/supabase/client";

/**
 * Find an item in a cart
 */
export const findCartItem = async (cartId: string, productId: string) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error finding cart item:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in findCartItem:', error);
    return null;
  }
};

/**
 * Add a new item to the cart
 */
export const addItemToCart = async (cartId: string, productId: string, quantity: number, price: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity: quantity,
        price_at_add: price
      });
      
    if (error) {
      console.error('Error adding item to cart:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addItemToCart:', error);
    return false;
  }
};

/**
 * Update the quantity of a cart item
 */
export const updateItemQuantity = async (itemId: string, newQuantity: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);
      
    if (error) {
      console.error('Error updating item quantity:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateItemQuantity:', error);
    return false;
  }
};

/**
 * Remove an item from the cart
 */
export const removeCartItem = async (itemId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
      
    if (error) {
      console.error('Error removing cart item:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    return false;
  }
};

/**
 * Clear all items from a cart
 */
export const clearCartItems = async (cartId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
      
    if (error) {
      console.error('Error clearing cart items:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in clearCartItems:', error);
    return false;
  }
};
