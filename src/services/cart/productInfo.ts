
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch product information including price and inventory
 */
export const fetchProductInfo = async (productId: string) => {
  try {
    console.log('[ProductInfo] Fetching product info for:', productId);
    
    // Enhanced query to get product info with additional error handling
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id, 
        nome, 
        preco_normal, 
        preco_promocional, 
        estoque, 
        vendedor_id,
        pontos_consumidor
      `)
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('[ProductInfo] Error fetching from produtos table:', error);
      
      // Fallback to products table if needed
      const { data: altProduct, error: altError } = await supabase
        .from('products')
        .select('id, nome, preco, preco_anterior, estoque, loja_id, pontos')
        .eq('id', productId)
        .single();
      
      if (altError) {
        console.error('[ProductInfo] Product not found in any table:', productId, altError);
        throw new Error('Produto não encontrado');
      }
      
      console.log('[ProductInfo] Found product in products table:', altProduct.id);
      
      // Transform products table data to match expected format
      return {
        id: altProduct.id,
        nome: altProduct.nome,
        preco: altProduct.preco,
        preco_anterior: altProduct.preco_anterior,
        estoque: altProduct.estoque,
        vendedor_id: altProduct.loja_id, // Correctly map loja_id to vendedor_id
        pontos: altProduct.pontos
      };
    }
    
    console.log('[ProductInfo] Found product in produtos table:', data.id);
    
    // Return the product from the main table with transformed fields
    return {
      id: data.id,
      nome: data.nome,
      preco: data.preco_promocional || data.preco_normal,
      preco_anterior: data.preco_normal,
      estoque: data.estoque,
      vendedor_id: data.vendedor_id,
      pontos: data.pontos_consumidor
    };
  } catch (error) {
    console.error('[ProductInfo] Error fetching product info:', error);
    throw error;
  }
};
