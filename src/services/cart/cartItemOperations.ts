
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { getCart } from "./cartFetcher";
import { ensureSingleActiveCart } from "./cartConsolidation";
import { 
  checkProductStock, 
  checkTotalStockAvailability 
} from "./stockChecker";
import { 
  addNewCartItem, 
  updateExistingCartItem, 
  findExistingCartItem, 
  removeCartItem, 
  clearCartItems as clearCartItemsFromCart 
} from "./cartItemModifier";

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

    // Check product stock
    const { hasStock, product, error: stockError } = await checkProductStock(productId, quantity);
    if (!hasStock) {
      throw stockError || new Error('Erro ao verificar estoque');
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
    const { item: existingItem, error: findError } = await findExistingCartItem(cartId, productId);
    if (findError) {
      throw findError;
    }

    console.log('[cartItemOperations] Existing cart item:', existingItem);

    if (existingItem) {
      // Check if we have enough stock for the increased quantity
      const stockCheck = await checkTotalStockAvailability(cartId, productId, quantity, existingItem);
      if (!stockCheck.hasStock) {
        throw stockCheck.error || new Error('Sem estoque suficiente');
      }

      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;
      console.log('[cartItemOperations] Updating cart item quantity:', existingItem.id, 'to:', newQuantity);
      
      const { success, error: updateError } = await updateExistingCartItem(existingItem.id, newQuantity);
      if (!success) {
        throw updateError || new Error('Erro ao atualizar item no carrinho');
      }
    } else {
      // Add new item to cart
      console.log('[cartItemOperations] Adding new item to cart:', cartId, productId, quantity, productPrice);
      
      const { success, error: addError } = await addNewCartItem(cartId, productId, quantity, productPrice);
      if (!success) {
        throw addError || new Error('Erro ao adicionar item ao carrinho');
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
    const { success, error } = await updateExistingCartItem(itemId, quantity);
    if (!success) {
      throw error || new Error('Erro ao atualizar quantidade');
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

    const { success } = await removeCartItem(itemId);
    return success;
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

    // Clear all items from cart
    const { success } = await clearCartItemsFromCart(cart.id);
    return success;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};
