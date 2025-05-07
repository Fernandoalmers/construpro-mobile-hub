
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { getCart } from "../cartFetcher";
import { ensureSingleActiveCart } from "../cartConsolidation";
import { checkProductStock, checkTotalStockAvailability } from "./stockChecker";
import { findExistingCartItem, updateExistingCartItem, addNewCartItem } from "./cartItemModifiers";
import { validateCartItemsStock } from "./stockChecker";
import { toast } from "@/components/ui/sonner";

/**
 * Add item to cart
 */
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    console.log('[addToCart] Adding to cart:', productId, 'quantity:', quantity);
    
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

    console.log('[addToCart] Using cart:', cartId);

    // Use the correct price field from the produtos table
    const productPrice = product.preco_promocional || product.preco_normal;
    console.log('[addToCart] Product price:', productPrice);

    // Check if the product is already in the cart
    const { item: existingItem, error: findError } = await findExistingCartItem(cartId, productId);
    if (findError) {
      throw findError;
    }

    console.log('[addToCart] Existing cart item:', existingItem);

    if (existingItem) {
      // Check if we have enough stock for the increased quantity
      const stockCheck = await checkTotalStockAvailability(cartId, productId, quantity, existingItem);
      if (!stockCheck.hasStock) {
        throw stockCheck.error || new Error('Sem estoque suficiente');
      }

      // Update quantity of existing item - cap at reasonable maximum
      const newQuantity = Math.min(existingItem.quantity + quantity, 99);
      console.log('[addToCart] Updating cart item quantity:', existingItem.id, 'to:', newQuantity);
      
      const { success, error: updateError } = await updateExistingCartItem(existingItem.id, newQuantity);
      if (!success) {
        throw updateError || new Error('Erro ao atualizar item no carrinho');
      }
    } else {
      // Add new item to cart
      console.log('[addToCart] Adding new item to cart:', cartId, productId, quantity, productPrice);
      
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
    console.log('[addToCart] Item added successfully, getting updated cart');
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
