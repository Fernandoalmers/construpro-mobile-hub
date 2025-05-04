
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/services/adminService';

/**
 * Approve a product
 * @param productId - ID of the product to approve
 * @returns Promise with a boolean indicating success
 */
export const approveProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[statusUpdates] Approving product:', productId);
    
    const { data, error } = await supabase
      .from('produtos')
      .update({ 
        status: 'aprovado', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
      
    console.log('[statusUpdates] Approve result:', data, error);
    
    if (error) {
      console.error('[statusUpdates] Error approving product:', error);
      return false;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'aprovado' }
    });
    
    return true;
  } catch (error) {
    console.error('[statusUpdates] Error approving product:', error);
    return false;
  }
};

/**
 * Reject a product
 * @param productId - ID of the product to reject
 * @returns Promise with a boolean indicating success
 */
export const rejectProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[statusUpdates] Rejecting product:', productId);
    
    const { data, error } = await supabase
      .from('produtos')
      .update({ 
        status: 'inativo', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
      
    console.log('[statusUpdates] Reject result:', data, error);
    
    if (error) {
      console.error('[statusUpdates] Error rejecting product:', error);
      return false;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'inativo' }
    });
    
    return true;
  } catch (error) {
    console.error('[statusUpdates] Error rejecting product:', error);
    return false;
  }
};

/**
 * Update a product's status
 * @param productId - ID of the product
 * @param status - New status
 * @returns Promise with a boolean indicating success
 */
export const updateProductStatus = async (
  productId: string, 
  status: 'pendente' | 'aprovado' | 'inativo'
): Promise<boolean> => {
  try {
    console.log('[statusUpdates] Updating product status:', productId, status);
    
    const { data, error } = await supabase
      .from('produtos')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
    
    console.log('[statusUpdates] Update status result:', data, error);
    
    if (error) {
      console.error(`[statusUpdates] Error updating product status to ${status}:`, error);
      return false;
    }
    
    // Log admin action for status changes
    if (status === 'aprovado' || status === 'inativo') {
      await logAdminAction({
        action: status === 'aprovado' ? 'approve_product' : 'reject_product',
        entityType: 'produto',
        entityId: productId,
        details: { status }
      });
    }
    
    return true;
  } catch (error) {
    console.error(`[statusUpdates] Error updating product status to ${status}:`, error);
    return false;
  }
};
