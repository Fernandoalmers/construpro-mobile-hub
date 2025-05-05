
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches product information from the 'produtos' table
 */
export async function fetchProductInfo(productId: string) {
  try {
    console.log('[productFetcher] Fetching product info for:', productId);
    
    // Use 'produtos' table
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
      console.error('[productFetcher] Error fetching product:', error);
      return null;
    }
    
    if (!data) {
      console.error('[productFetcher] Product not found:', productId);
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
