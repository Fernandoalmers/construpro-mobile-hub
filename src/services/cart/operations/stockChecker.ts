
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
