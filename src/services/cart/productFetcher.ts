
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches product info for cart items
 */
export const productFetcher = {
  /**
   * Fetch product info by ID
   */
  fetchProductInfo: async (productId: string) => {
    try {
      if (!productId) {
        console.error('[productFetcher] Invalid product ID');
        return null;
      }
      
      console.log('[productFetcher] Fetching product:', productId);
      
      const { data: product, error } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          preco_normal,
          preco_promocional,
          imagens,
          estoque,
          vendedor_id,
          pontos_consumidor,
          descricao,
          categoria
        `)
        .eq('id', productId)
        .single();
        
      if (error) {
        console.error('[productFetcher] Error fetching product:', error);
        return null;
      }
      
      if (!product) {
        console.log('[productFetcher] Product not found:', productId);
        return null;
      }
      
      // Extract first image from imagens array if available
      let imageUrl = null;
      if (product.imagens && Array.isArray(product.imagens) && product.imagens.length > 0) {
        imageUrl = String(product.imagens[0]);
      }
      
      return {
        id: product.id,
        nome: product.nome,
        preco: product.preco_promocional || product.preco_normal,
        imagem_url: imageUrl,
        imagens: product.imagens,
        estoque: product.estoque,
        vendedor_id: product.vendedor_id,
        pontos: product.pontos_consumidor,
        descricao: product.descricao,
        categoria: product.categoria
      };
    } catch (error) {
      console.error('[productFetcher] Error in fetchProductInfo:', error);
      return null;
    }
  }
};
