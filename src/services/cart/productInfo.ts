
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch product information including price and inventory
 */
export const fetchProductInfo = async (productId: string) => {
  try {
    // Try to get product from produtos table first (main products table)
    let { data: product, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_normal, preco_promocional, estoque, loja_id, pontos_consumidor')
      .eq('id', productId)
      .single();
    
    // If not found in the main table, try the products table (older/alternative table)
    if (error || !product) {
      const { data: altProduct, error: altError } = await supabase
        .from('products')
        .select('id, nome, preco, preco_anterior, estoque, loja_id, pontos')
        .eq('id', productId)
        .single();
      
      if (altError || !altProduct) {
        console.error('Product not found in any table:', productId);
        return null;
      }
      
      // Transform to match expected structure
      product = {
        id: altProduct.id,
        nome: altProduct.nome,
        preco_normal: altProduct.preco,
        preco_promocional: altProduct.preco_anterior && altProduct.preco_anterior < altProduct.preco ? altProduct.preco_anterior : null,
        estoque: altProduct.estoque,
        loja_id: altProduct.loja_id,
        pontos_consumidor: altProduct.pontos
      };
    }
    
    return {
      id: product.id,
      nome: product.nome,
      preco: product.preco_promocional || product.preco_normal,
      estoque: product.estoque,
      loja_id: product.loja_id,
      pontos: product.pontos_consumidor
    };
  } catch (error) {
    console.error('Error fetching product info:', error);
    return null;
  }
};
