
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch product information including price and inventory
 */
export const fetchProductInfo = async (productId: string) => {
  try {
    console.log('[ProductInfo] Fetching product info for:', productId);
    
    // Try to get product from produtos table first (main products table)
    let { data: product, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_normal, preco_promocional, estoque, vendedor_id, pontos_consumidor')
      .eq('id', productId)
      .single();
    
    // If not found in the main table, try the products table (older/alternative table)
    if (error || !product) {
      console.log('[ProductInfo] Product not found in produtos table, checking products table');
      const { data: altProduct, error: altError } = await supabase
        .from('products')
        .select('id, nome, preco, preco_anterior, estoque, loja_id, pontos')
        .eq('id', productId)
        .single();
      
      if (altError || !altProduct) {
        console.error('[ProductInfo] Product not found in any table:', productId, altError);
        return null;
      }
      
      console.log('[ProductInfo] Found product in products table:', altProduct.id);
      
      // Return the transformed product from the alternative table
      return {
        id: altProduct.id,
        nome: altProduct.nome,
        preco: altProduct.preco,
        preco_anterior: altProduct.preco_anterior,
        estoque: altProduct.estoque,
        loja_id: altProduct.loja_id,
        pontos: altProduct.pontos
      };
    }
    
    console.log('[ProductInfo] Found product in produtos table:', product.id);
    
    // Return the product from the main table with transformed fields
    return {
      id: product.id,
      nome: product.nome,
      preco: product.preco_promocional || product.preco_normal,
      preco_anterior: product.preco_normal,
      estoque: product.estoque,
      loja_id: product.vendedor_id, // Use vendedor_id as loja_id in produtos table
      pontos: product.pontos_consumidor
    };
  } catch (error) {
    console.error('[ProductInfo] Error fetching product info:', error);
    return null;
  }
};
