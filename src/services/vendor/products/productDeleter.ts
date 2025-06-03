
import { supabase } from '@/integrations/supabase/client';

/**
 * Delete a vendor product
 */
export const deleteVendorProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[productDeleter] Deleting product with ID:', productId);
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error('[productDeleter] Error deleting product:', error);
      return false;
    }
    
    console.log('[productDeleter] Product deleted successfully');
    return true;
  } catch (error) {
    console.error('[productDeleter] Error in deleteVendorProduct:', error);
    return false;
  }
};
