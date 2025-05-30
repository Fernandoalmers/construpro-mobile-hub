
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
    
    // Directly update the product status with the new RLS policy in place
    const { error, data } = await supabase
      .from('produtos')
      .update({ 
        status: 'aprovado', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId)
      .select();
      
    if (error) {
      console.error('[statusUpdates] Error approving product:', error);
      return false;
    }
    
    console.log('[statusUpdates] Product approved successfully:', data);
    
    // Log the admin action
    try {
      await logAdminAction({
        action: 'approve_product',
        entityType: 'produto',
        entityId: productId,
        details: { status: 'aprovado' }
      });
      console.log('[statusUpdates] Admin action logged successfully');
    } catch (logError) {
      console.error('[statusUpdates] Error logging admin action:', logError);
      // Continue even if logging fails
    }
    
    return true;
  } catch (error) {
    console.error('[statusUpdates] Exception in approveProduct:', error);
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
    
    const { error, data } = await supabase
      .from('produtos')
      .update({ 
        status: 'inativo', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId)
      .select();
      
    if (error) {
      console.error('[statusUpdates] Error rejecting product:', error);
      return false;
    }
    
    console.log('[statusUpdates] Product rejected successfully:', data);
    
    // Log the admin action
    try {
      await logAdminAction({
        action: 'reject_product',
        entityType: 'produto',
        entityId: productId,
        details: { status: 'inativo' }
      });
      console.log('[statusUpdates] Admin action logged successfully');
    } catch (logError) {
      console.error('[statusUpdates] Error logging admin action:', logError);
      // Continue even if logging fails
    }
    
    return true;
  } catch (error) {
    console.error('[statusUpdates] Exception in rejectProduct:', error);
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
    
    const { error, data } = await supabase
      .from('produtos')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId)
      .select();
    
    if (error) {
      console.error(`[statusUpdates] Error updating product status to ${status}:`, error);
      return false;
    }
    
    console.log(`[statusUpdates] Product status updated to ${status} successfully:`, data);
    
    // Log admin action for status changes
    if (status === 'aprovado' || status === 'inativo') {
      const action = status === 'aprovado' ? 'approve_product' : 'reject_product';
      try {
        await logAdminAction({
          action,
          entityType: 'produto',
          entityId: productId,
          details: { status }
        });
        console.log('[statusUpdates] Admin action logged successfully');
      } catch (logError) {
        console.error('[statusUpdates] Error logging admin action:', logError);
        // Continue even if logging fails
      }
    }
    
    return true;
  } catch (error) {
    console.error(`[statusUpdates] Exception in updateProductStatus to ${status}:`, error);
    return false;
  }
};
