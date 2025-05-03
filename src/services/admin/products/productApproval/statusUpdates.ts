
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '@/services/adminService';

/**
 * Approve a product
 * @param productId - ID of the product to approve
 * @returns Promise with a boolean indicating success
 */
export const approveProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'aprovado' }
    });
    
    return true;
  } catch (error) {
    console.error('Error approving product:', error);
    throw error;
  }
};

/**
 * Reject a product
 * @param productId - ID of the product to reject
 * @returns Promise with a boolean indicating success
 */
export const rejectProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'inativo' }
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting product:', error);
    throw error;
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
    const { error } = await supabase
      .from('produtos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (error) throw error;
    
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
    console.error(`Error updating product status to ${status}:`, error);
    return false;
  }
};
