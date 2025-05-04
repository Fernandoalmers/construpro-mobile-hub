
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
    
    // Try using the dedicated Supabase function first
    try {
      const { data: funcResult, error: funcError } = await supabase.rpc('approve_product', {
        product_id: productId
      });
      
      if (!funcError) {
        console.log('[statusUpdates] Product approved using RPC function');
        
        // Log the admin action
        await logAdminAction({
          action: 'approve_product',
          entityType: 'produto',
          entityId: productId,
          details: { status: 'aprovado' }
        });
        
        return true;
      }
      
      console.log('[statusUpdates] RPC function failed, falling back to direct update:', funcError);
    } catch (rpcError) {
      console.log('[statusUpdates] RPC function not available, using direct update');
    }
    
    // Direct update (fallback)
    const { error } = await supabase
      .from('produtos')
      .update({ 
        status: 'aprovado', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
      
    if (error) {
      console.error('[statusUpdates] Error approving product:', error);
      return false;
    }
    
    console.log('[statusUpdates] Product approved via direct update');
    
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
    
    const { error } = await supabase
      .from('produtos')
      .update({ 
        status: 'inativo', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
      
    if (error) {
      console.error('[statusUpdates] Error rejecting product:', error);
      return false;
    }
    
    console.log('[statusUpdates] Product rejected successfully');
    
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
    
    const { error } = await supabase
      .from('produtos')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
    
    if (error) {
      console.error(`[statusUpdates] Error updating product status to ${status}:`, error);
      return false;
    }
    
    console.log(`[statusUpdates] Product status updated to ${status} successfully`);
    
    // Log admin action for status changes
    if (status === 'aprovado' || status === 'inativo') {
      const action = status === 'aprovado' ? 'approve_product' : 'reject_product';
      await logAdminAction({
        action,
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
