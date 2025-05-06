
import { supabase } from '@/integrations/supabase/client';

/**
 * Service to fetch product information for cart operations
 */
export const productFetcher = {
  /**
   * Fetch product information by ID
   */
  async fetchProductInfo(productId: string) {
    try {
      console.log('[productFetcher] Fetching product:', productId);
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) {
        console.error('[productFetcher] Error fetching product:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('[productFetcher] Product not found:', productId);
        return null;
      }
      
      console.log('[productFetcher] Product fetched successfully:', data.id);
      return data;
    } catch (err) {
      console.error('[productFetcher] Error in fetchProductInfo:', err);
      return null;
    }
  },
  
  /**
   * Convert product data to cart item format
   */
  formatProductForCart(product: any, quantity: number) {
    if (!product) return null;
    
    // Extract image URL from imagens array if available
    let imageUrl = null;
    if (product.imagens && Array.isArray(product.imagens) && product.imagens.length > 0) {
      imageUrl = product.imagens[0];
    }
    
    const price = product.preco_promocional || product.preco_normal;
    
    return {
      produto_id: product.id,
      quantidade: quantity,
      preco: price,
      subtotal: price * quantity,
      produto: {
        id: product.id,
        nome: product.nome,
        preco: price,
        imagem_url: imageUrl,
        estoque: product.estoque,
        loja_id: product.vendedor_id,
        pontos: product.pontos_consumidor || 0
      }
    };
  }
};
