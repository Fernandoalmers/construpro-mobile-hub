
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches product details by product ID
 */
export const fetchProductDetails = async (productId: string): Promise<any> => {
  try {
    if (!productId) {
      console.error('No product ID provided to fetchProductDetails');
      return null;
    }

    console.log(`Fetching product details for product: ${productId}`);
    
    const { data: product, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
    
    return product;
  } catch (error) {
    console.error('Error in fetchProductDetails:', error);
    return null;
  }
};
