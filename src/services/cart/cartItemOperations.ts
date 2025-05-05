import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { getCart } from "./cartFetcher";
import { ensureSingleActiveCart } from "./cartConsolidation";

/**
 * Add item to cart
 */
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    console.log('[cartItemOperations] Adding to cart:', productId, 'quantity:', quantity);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      throw new Error('Usuário não autenticado');
    }

    // Get product information to check stock and price
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('id, preco_normal, preco_promocional, estoque')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Error fetching product:', productError);
      throw new Error('Produto não encontrado');
    }

    // Check inventory
    if (product.estoque < quantity) {
      throw new Error(`Apenas ${product.estoque} itens disponíveis em estoque`);
    }

    // Ensure we have a single active cart and get its ID
    const cartId = await ensureSingleActiveCart(userData.user.id);
    if (!cartId) {
      throw new Error('Não foi possível criar ou acessar o carrinho');
    }

    console.log('[cartItemOperations] Using cart:', cartId);

    // Use the correct price field from the produtos table
    const productPrice = product.preco_promocional || product.preco_normal;
    console.log('[cartItemOperations] Product price:', productPrice);

    // Check if the product is already in the cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();

    console.log('[cartItemOperations] Existing cart item:', existingItem, existingItemError);

    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.estoque < newQuantity) {
        throw new Error(`Não é possível adicionar mais itens. Apenas ${product.estoque} disponíveis em estoque`);
      }

      console.log('[cartItemOperations] Updating cart item quantity:', existingItem.id, 'to:', newQuantity);
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        throw new Error('Erro ao atualizar item no carrinho');
      }
    } else {
      // Add new item to cart
      console.log('[cartItemOperations] Adding new item to cart:', cartId, productId, quantity, productPrice);
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity: quantity,
          price_at_add: productPrice
        });

      if (insertError) {
        console.error('Error adding item to cart:', insertError);
        throw new Error('Erro ao adicionar item ao carrinho');
      }
    }

    // Return updated cart
    console.log('[cartItemOperations] Item added successfully, getting updated cart');
    return await getCart();
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
  try {
    console.log('[cartItemOperations] Updating cart item quantity:', itemId, quantity);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      throw new Error('Usuário não autenticado');
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (updateError) {
      console.error('Error updating quantity:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    return false;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<boolean> => {
  try {
    console.log('[cartItemOperations] Removing item from cart:', itemId);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

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
    console.error('Error removing from cart:', error);
    return false;
  }
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<boolean> => {
  try {
    console.log('[cartItemOperations] Clearing cart');
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

    // Delete all items in cart
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

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
