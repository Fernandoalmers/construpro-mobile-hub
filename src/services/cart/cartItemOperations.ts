
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { getCart } from "./cartFetcher";
import { ensureSingleActiveCart } from "./cartConsolidation";
import { 
  checkProductStock, 
  checkTotalStockAvailability,
  validateCartItemsStock
} from "./stockChecker";
import { 
  addNewCartItem, 
  updateExistingCartItem, 
  findExistingCartItem, 
  removeCartItem, 
  clearCartItems as clearCartItemsFromCart 
} from "./cartItemModifier";
import { toast } from "@/components/ui/sonner";

/**
 * Add item to cart
 */
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    console.log('[cartItemOperations] Adding to cart:', productId, 'quantity:', quantity);
    
    // Validate inputs
    if (!productId) {
      console.error('Invalid product ID');
      throw new Error('ID do produto inválido');
    }
    
    if (quantity <= 0) {
      console.error('Invalid quantity:', quantity);
      throw new Error('Quantidade inválida');
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      throw new Error('Usuário não autenticado');
    }

    console.log('[addToCart] IDs', { user_id: userData.user?.id, product_id: productId });

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

      // Update quantity of existing item - cap at reasonable maximum
      const newQuantity = Math.min(existingItem.quantity + quantity, 99);
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

      // For debugging, directly check if item was added
      const { data: inserted, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .single();
        
      console.log('[addToCart result]', { data: inserted, error: checkError });
    }

    // Return updated cart
    console.log('[cartItemOperations] Item added successfully, getting updated cart');
    const updatedCart = await getCart();
    
    // Validate if any items have stock issues
    if (updatedCart && updatedCart.id) {
      const { invalidItems } = await validateCartItemsStock(updatedCart.id);
      
      // If there are invalid items, warn the user but don't prevent the operation
      if (invalidItems.length > 0) {
        console.warn(`Found ${invalidItems.length} items with stock issues`);
        // We could add a toast here if desired
      }
    }
    
    return updatedCart;
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
    
    if (!itemId) {
      console.error('Invalid item ID');
      throw new Error('ID do item inválido');
    }
    
    if (quantity <= 0) {
      console.error('Invalid quantity:', quantity);
      throw new Error('Quantidade inválida');
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      throw new Error('Usuário não autenticado');
    }

    // Get item info to verify product stock
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select('product_id, cart_id')
      .eq('id', itemId)
      .single();
      
    if (itemError || !item) {
      console.error('Error fetching cart item:', itemError);
      throw new Error('Item não encontrado');
    }
    
    // Check if product has enough stock
    const { hasStock, error: stockError } = await checkProductStock(item.product_id, quantity);
    if (!hasStock) {
      throw stockError || new Error('Sem estoque suficiente');
    }

    // Update quantity with a reasonable cap
    const cappedQuantity = Math.min(quantity, 99);
    const { success, error } = await updateExistingCartItem(itemId, cappedQuantity);
    if (!success) {
      throw error || new Error('Erro ao atualizar quantidade');
    }

    return true;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (itemId: string): Promise<boolean> => {
  try {
    console.log('[cartItemOperations] Removing item from cart:', itemId);
    
    if (!itemId) {
      console.error('Invalid item ID');
      return false;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    const { success, error } = await removeCartItem(itemId);
    if (!success) {
      console.error('Error removing item:', error);
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

    // Clear all items from cart
    const { success } = await clearCartItemsFromCart(cart.id);
    return success;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

/**
 * Fix cart items with stock issues
 * This will adjust quantities or remove items that exceed available stock
 */
export const fixCartStockIssues = async (): Promise<boolean> => {
  try {
    console.log('[cartItemOperations] Fixing cart stock issues');
    
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
    
    // Validate cart items
    const { invalidItems } = await validateCartItemsStock(cart.id);
    
    if (invalidItems.length === 0) {
      console.log('No stock issues found');
      return true;
    }
    
    console.log(`Found ${invalidItems.length} items with stock issues, fixing...`);
    
    // Fix each invalid item
    for (const item of invalidItems) {
      if (item.availableStock > 0) {
        // Update to available stock
        console.log(`Adjusting item ${item.id} quantity from ${item.quantity} to ${item.availableStock}`);
        await updateExistingCartItem(item.id, item.availableStock);
        toast.warning(`Quantidade de um item ajustada devido à disponibilidade de estoque`);
      } else {
        // Remove item if no stock
        console.log(`Removing item ${item.id} due to no stock`);
        await removeCartItem(item.id);
        toast.error(`Um item foi removido do carrinho por não ter estoque disponível`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing cart stock issues:', error);
    return false;
  }
};
