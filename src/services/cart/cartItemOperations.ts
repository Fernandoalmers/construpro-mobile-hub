
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { getCart } from "./cartCore";

/**
 * Add item to cart
 */
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // Get product information
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('id, preco_normal, preco_promocional, estoque')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      return null;
    }

    // Check inventory
    if (product.estoque < quantity) {
      throw new Error(`Only ${product.estoque} items available in stock`);
    }

    // Get or create active cart
    let { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // No active cart found, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ 
            user_id: userData.user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating cart:', createError);
          return null;
        }

        cartData = newCart;
      } else {
        console.error('Error fetching cart:', cartError);
        return null;
      }
    }

    // Check if the product is already in the cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartData.id)
      .eq('product_id', productId)
      .single();

    if (existingItemError && existingItemError.code !== 'PGRST116') {
      console.error('Error checking existing items:', existingItemError);
      return null;
    }

    // Use the correct price field from the produtos table
    const productPrice = product.preco_promocional || product.preco_normal;

    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.estoque < newQuantity) {
        throw new Error(`Cannot add more items. Only ${product.estoque} available in stock`);
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return null;
      }
    } else {
      // Add new item to cart
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartData.id,
          product_id: productId,
          quantity: quantity,
          price_at_add: productPrice
        });

      if (insertError) {
        console.error('Error adding item to cart:', insertError);
        return null;
      }
    }

    // Return updated cart
    return await getCart();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (itemId: string, quantity: number): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // Get the cart item to check against current inventory
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        produtos:product_id (estoque)
      `)
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      console.error('Error fetching cart item:', itemError);
      return null;
    }

    // Check inventory
    if (item.produtos.estoque < quantity) {
      throw new Error(`Cannot update quantity. Only ${item.produtos.estoque} available in stock`);
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error updating quantity:', updateError);
      return null;
    }

    // Return updated cart
    return await getCart();
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<Cart | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error removing cart item:', error);
      return null;
    }

    // Return updated cart
    return await getCart();
  } catch (error) {
    console.error('Error removing from cart:', error);
    return null;
  }
};
