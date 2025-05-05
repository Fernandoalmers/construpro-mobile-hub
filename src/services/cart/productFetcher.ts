
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches product information from the 'produtos' table
 */
export async function fetchProductInfo(productId: string) {
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
      imagens: data.imagens
    };
    
    console.log('Product info processed:', productInfo);
    return productInfo;
  } catch (error) {
    console.error('Error in fetchProductInfo:', error);
    return null;
  }
}
