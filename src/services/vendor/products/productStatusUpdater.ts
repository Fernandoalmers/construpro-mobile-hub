
import { supabase } from '@/integrations/supabase/client';

/**
 * Update a product's status
 */
export const updateProductStatus = async (
  productId: string, 
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo'
): Promise<boolean> => {
  try {
    console.log(`[productStatusUpdater] Updating product ${productId} status to: ${status}`);
    
    const { error } = await supabase
      .from('produtos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (error) {
      console.error('[productStatusUpdater] Error updating product status:', error);
      return false;
    }
    
    console.log('[productStatusUpdater] Product status updated successfully');
    return true;
  } catch (error) {
    console.error('[productStatusUpdater] Error in updateProductStatus:', error);
    return false;
  }
};
