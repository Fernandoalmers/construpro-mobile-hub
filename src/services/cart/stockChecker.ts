
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if product has enough stock for the requested quantity
 */
export const checkProductStock = async (productId: string, quantity: number) => {
  try {
    const { data: product, error } = await supabase
      .from('produtos')
      .select('estoque, preco_normal, preco_promocional')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('Error checking product stock:', error);
      return { hasStock: false, error, product: null };
    }
    
    if (!product) {
      return { hasStock: false, error: new Error('Produto não encontrado'), product: null };
    }
    
    if (product.estoque < quantity) {
      return { 
        hasStock: false, 
        error: new Error(`Estoque insuficiente. Disponível: ${product.estoque}`),
        product
      };
    }
    
    return { hasStock: true, error: null, product };
  } catch (error) {
    console.error('Error in checkProductStock:', error);
    return { hasStock: false, error, product: null };
  }
};

/**
 * Check if product has enough stock for the requested quantity
 * taking into account existing cart items
 */
export const checkTotalStockAvailability = async (
  cartId: string, 
  productId: string, 
  additionalQuantity: number,
  existingItem: { id: string; quantity: number }
) => {
  try {
    // Get product stock
    const { hasStock, error, product } = await checkProductStock(productId, existingItem.quantity + additionalQuantity);
    return { hasStock, error, product };
  } catch (error) {
    console.error('Error in checkTotalStockAvailability:', error);
    return { hasStock: false, error, product: null };
  }
};

/**
 * Validate all items in cart against current stock levels
 * Returns invalid items with available stock levels
 */
export const validateCartItemsStock = async (cartId: string) => {
  try {
    // Get all cart items
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity')
      .eq('cart_id', cartId);
      
    if (itemsError || !items) {
      console.error('Error getting cart items:', itemsError);
      return { invalidItems: [], error: itemsError };
    }
    
    // Check each item
    const invalidItems = [];
    
    for (const item of items) {
      // Get product stock
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('estoque')
        .eq('id', item.product_id)
        .single();
        
      if (productError || !product) {
        console.error(`Error getting product ${item.product_id}:`, productError);
        invalidItems.push({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          availableStock: 0,
          valid: false
        });
        continue;
      }
      
      if (product.estoque < item.quantity) {
        invalidItems.push({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          availableStock: product.estoque,
          valid: false
        });
      }
    }
    
    return { invalidItems, error: null };
  } catch (error) {
    console.error('Error in validateCartItemsStock:', error);
    return { invalidItems: [], error };
  }
};
