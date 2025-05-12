
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a product has sufficient stock for the requested quantity
 */
export const checkProductStock = async (productId: string, quantity: number) => {
  try {
    console.log('[stockChecker] Checking stock for product:', productId, 'quantity:', quantity);
    
    if (!productId || quantity <= 0) {
      return { 
        hasStock: false, 
        product: null, 
        error: new Error('Invalid product ID or quantity') 
      };
    }
    
    // Get product details including stock level
    const { data: product, error } = await supabase
      .from('produtos')
      .select('id, nome, estoque, preco_normal, preco_promocional')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('[stockChecker] Error fetching product:', error);
      return { 
        hasStock: false, 
        product: null, 
        error: error 
      };
    }
    
    if (!product) {
      console.error('[stockChecker] Product not found:', productId);
      return { 
        hasStock: false, 
        product: null, 
        error: new Error('Produto não encontrado') 
      };
    }
    
    const hasStock = product.estoque >= quantity;
    
    if (!hasStock) {
      console.log(`[stockChecker] Insufficient stock for product ${productId}: requested ${quantity}, available ${product.estoque}`);
      return { 
        hasStock: false, 
        product, 
        error: new Error(`Quantidade solicitada indisponível (disponível: ${product.estoque})`) 
      };
    }
    
    console.log(`[stockChecker] Stock check passed for product ${productId}: ${product.estoque} available`);
    return { hasStock: true, product, error: null };
  } catch (error) {
    console.error('[stockChecker] Error checking product stock:', error);
    return { 
      hasStock: false, 
      product: null, 
      error: new Error('Erro ao verificar estoque do produto') 
    };
  }
};

/**
 * Validate all items in cart against current stock levels
 * Returns invalid items with available stock levels
 */
export const validateCartItemsStock = async (cartId: string) => {
  try {
    console.log('[stockChecker] Validating cart items stock for cart:', cartId);
    
    // Get all cart items
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity')
      .eq('cart_id', cartId);
      
    if (itemsError || !items) {
      console.error('[stockChecker] Error getting cart items:', itemsError);
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
        console.error(`[stockChecker] Error getting product ${item.product_id}:`, productError);
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
    
    console.log(`[stockChecker] Found ${invalidItems.length} items with stock issues`);
    return { invalidItems, error: null };
  } catch (error) {
    console.error('[stockChecker] Error in validateCartItemsStock:', error);
    return { invalidItems: [], error };
  }
};
