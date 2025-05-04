
import { supabase } from '@/integrations/supabase/client';

/**
 * Debug function to fetch products with detailed logging
 */
export const debugFetchProducts = async () => {
  console.log('[debugFetchProducts] Debug fetch products called');
  try {
    console.log('[debugFetchProducts] Testando query direta de produtos com vendedores');
    const { data, error } = await supabase
      .from('produtos')
      .select('*, vendedores:vendedor_id(nome_loja)')
      .limit(10);
    console.log('[debugFetchProducts] Debug productos data:', data);
    
    if (error) {
      console.error('[debugFetchProducts] Error in debug fetch:', error);
      return { error };
    }
    
    return { data };
  } catch (err) {
    console.error('[debugFetchProducts] Unexpected error in debug fetch:', err);
    return { error: err };
  }
};
