
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch product information
 */
export const fetchProductInfo = async (productId: string) => {
  try {
    const { data: product, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product info:', error);
      return null;
    }

    return product;
  } catch (error) {
    console.error('Error in fetchProductInfo:', error);
    return null;
  }
};
