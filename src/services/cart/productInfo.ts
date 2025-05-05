
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch product information
 */
export const fetchProductInfo = async (productId: string) => {
  try {
    console.log('Fetching product info for ID:', productId);
    
    const { data: product, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product info:', error);
      return null;
    }

    // Ensure we're using the correct price fields
    if (product) {
      // Map price fields to ensure consistency - using preco_normal and preco_promocional
      // which are the actual fields in the produtos table
      const finalPrice = product.preco_promocional || product.preco_normal;
      
      console.log('Product info retrieved successfully:', {
        id: product.id,
        nome: product.nome,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        finalPrice: finalPrice,
        estoque: product.estoque
      });
      
      // Add a calculated preco field for compatibility with existing code
      const enrichedProduct = {
        ...product,
        preco: finalPrice
      };
      
      return enrichedProduct;
    }

    return product;
  } catch (error) {
    console.error('Error in fetchProductInfo:', error);
    return null;
  }
};
