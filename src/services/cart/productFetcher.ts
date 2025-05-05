
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches product information from the 'produtos' table
 * with additional error handling and improved logging
 */
export async function fetchProductInfo(productId: string) {
  try {
    console.log('[productFetcher] Fetching product info for:', productId);
    
    // Use 'produtos' table with a more detailed query
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id, 
        nome, 
        preco_normal, 
        preco_promocional, 
        estoque, 
        pontos_consumidor, 
        vendedor_id,
        imagens,
        vendedores:vendedor_id (
          id,
          nome_loja,
          logo
        )
      `)
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('[productFetcher] Error fetching product from produtos table:', error);
      
      // Try fallback to 'products' table if it exists
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select(`
          id, 
          nome, 
          preco, 
          preco_anterior, 
          estoque, 
          pontos,
          loja_id,
          imagem_url
        `)
        .eq('id', productId)
        .single();
      
      if (fallbackError) {
        console.error('[productFetcher] Product not found in any table:', productId);
        return null;
      }
      
      console.log('[productFetcher] Product found in fallback products table:', fallbackData);
      
      // Map the fallback data to the expected format
      return {
        id: fallbackData.id,
        nome: fallbackData.nome,
        preco: fallbackData.preco,
        preco_anterior: fallbackData.preco_anterior,
        estoque: fallbackData.estoque,
        pontos: fallbackData.pontos,
        vendedor_id: fallbackData.loja_id,
        imagens: [fallbackData.imagem_url],
        vendedor: null // No joined data in fallback
      };
    }
    
    if (!data) {
      console.error('[productFetcher] Product data not found:', productId);
      return null;
    }
    
    console.log('[productFetcher] Product data retrieved:', data);
    
    // Map the fields correctly
    const productInfo = {
      id: data.id,
      nome: data.nome,
      preco: data.preco_promocional || data.preco_normal,
      preco_anterior: data.preco_normal,
      estoque: data.estoque,
      pontos: data.pontos_consumidor,
      vendedor_id: data.vendedor_id,
      imagens: data.imagens,
      vendedor: data.vendedores ? {
        id: data.vendedores.id,
        nome_loja: data.vendedores.nome_loja,
        logo_url: data.vendedores.logo
      } : null
    };
    
    console.log('[productFetcher] Product info processed:', productInfo);
    return productInfo;
  } catch (error) {
    console.error('[productFetcher] Error in fetchProductInfo:', error);
    return null;
  }
}
