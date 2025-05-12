
import { supabase } from '@/integrations/supabase/client';
import { ensureSingleActiveCart } from './consolidation/consolidateActiveCart';
import { getCart } from './fetcher/getCart';
import { checkProductStock } from './stockChecker';

/**
 * Add item to cart
 */
export async function addToCart(productId: string, quantity: number = 1): Promise<void> {
  try {
    console.log('[cartItemOperations] Adding to cart:', productId, quantity);
    
    // Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      throw new Error('Usuário não autenticado');
    }
    
    const userId = userData.user.id;
    
    // Check product stock
    const { hasStock, error: stockError, product } = await checkProductStock(productId, quantity);
    if (!hasStock) {
      throw stockError || new Error('Produto sem estoque disponível');
    }
    
    // Ensure single active cart
    const cartId = await ensureSingleActiveCart(userId);
    if (!cartId) {
      throw new Error('Não foi possível criar ou acessar o carrinho');
    }
    
    // Check if item already exists in cart
    const { data: existingItem, error: findError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();
      
    if (findError && findError.code !== 'PGRST116') {
      console.error('[cartItemOperations] Error finding existing cart item:', findError);
    }
    
    const productPrice = product.preco_promocional || product.preco_normal;
    
    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;
      
      // Ensure new quantity doesn't exceed stock
      if (newQuantity > product.estoque) {
        throw new Error(`Quantidade total excederia o estoque disponível (${product.estoque})`);
      }
      
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);
        
      if (updateError) {
        throw new Error('Erro ao atualizar item no carrinho');
      }
    } else {
      // Add new item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
          price_at_add: productPrice
        });
        
      if (insertError) {
        throw new Error('Erro ao adicionar item ao carrinho');
      }
    }
    
  } catch (error: any) {
    console.error('[cartItemOperations] Error adding to cart:', error);
    throw error;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<void> {
  try {
    console.log('[cartItemOperations] Updating cart item quantity:', itemId, quantity);
    
    if (quantity < 1) {
      throw new Error('A quantidade deve ser pelo menos 1');
    }
    
    // Get the item to check the product stock
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('id', itemId)
      .single();
      
    if (itemError) {
      throw new Error('Item não encontrado');
    }
    
    // Check product stock
    const { hasStock, error: stockError } = await checkProductStock(item.product_id, quantity);
    if (!hasStock) {
      throw stockError || new Error('Produto sem estoque suficiente');
    }
    
    // Update the item
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
      
    if (updateError) {
      throw new Error('Erro ao atualizar quantidade');
    }
    
  } catch (error: any) {
    console.error('[cartItemOperations] Error updating quantity:', error);
    throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<void> {
  try {
    console.log('[cartItemOperations] Removing from cart:', itemId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
      
    if (error) {
      throw new Error('Erro ao remover item do carrinho');
    }
    
  } catch (error: any) {
    console.error('[cartItemOperations] Error removing from cart:', error);
    throw error;
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(): Promise<void> {
  try {
    console.log('[cartItemOperations] Clearing cart');
    
    // Get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .maybeSingle();
      
    if (cartError && cartError.code !== 'PGRST116') {
      throw new Error('Erro ao acessar o carrinho');
    }
    
    if (cart) {
      // Remove all items
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      if (error) {
        throw new Error('Erro ao limpar o carrinho');
      }
    }
    
  } catch (error: any) {
    console.error('[cartItemOperations] Error clearing cart:', error);
    throw error;
  }
}
