
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility for fetching product information 
 */
export const productFetcher = {
  /**
   * Fetches product information from the database
   */
  async fetchProductInfo(productId: string) {
    try {
      console.log('Fetching product info for:', productId);
      
      // Use 'produtos' table
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco_normal, preco_promocional, estoque, pontos_consumidor, vendedor_id, imagens')
        .eq('id', productId)
        .single();
        
      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }
      
      if (!data) {
        console.error('Product not found:', productId);
        return null;
      }
      
      console.log('Product data retrieved:', data);
      
      // Map the fields correctly
      const productInfo = {
        id: data.id,
        nome: data.nome,
        preco: data.preco_promocional || data.preco_normal,
        estoque: data.estoque,
        pontos: data.pontos_consumidor,
        vendedor_id: data.vendedor_id,
        imagem_url: data.imagens && data.imagens.length > 0 ? data.imagens[0] : null
      };
      
      console.log('Product info processed:', productInfo);
      return productInfo;
    } catch (error) {
      console.error('Error in fetchProductInfo:', error);
      return null;
    }
  }
};
