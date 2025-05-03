
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '../../adminService';

/**
 * Approve a product
 */
export const approveProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[AdminProductActions] Approving product:', productId);
    const { data, error } = await supabase
      .from('produtos')
      .update({ 
        status: 'aprovado', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
      
    if (error) {
      console.error('[AdminProductActions] Error approving product:', error);
      toast.error(`Erro ao aprovar produto: ${error.message}`);
      throw error;
    }
    
    console.log('[AdminProductActions] Update result:', data, error);
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'aprovado' }
    });
    
    toast.success('Produto aprovado com sucesso');
    return true;
  } catch (error) {
    console.error('[AdminProductActions] Error approving product:', error);
    toast.error('Erro ao aprovar produto');
    return false;
  }
};

/**
 * Reject a product
 */
export const rejectProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[AdminProductActions] Rejecting product:', productId);
    const { data, error } = await supabase
      .from('produtos')
      .update({ 
        status: 'inativo', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', productId);
      
    if (error) {
      console.error('[AdminProductActions] Error rejecting product:', error);
      toast.error(`Erro ao rejeitar produto: ${error.message}`);
      throw error;
    }
    
    console.log('[AdminProductActions] Update result:', data, error);
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'inativo' }
    });
    
    toast.success('Produto rejeitado com sucesso');
    return true;
  } catch (error) {
    console.error('[AdminProductActions] Error rejecting product:', error);
    toast.error('Erro ao rejeitar produto');
    return false;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);
      
    if (error) {
      console.error('[AdminProductActions] Error deleting product:', error);
      toast.error(`Erro ao excluir produto: ${error.message}`);
      throw error;
    }
    
    console.log('[AdminProductActions] Delete result:', data, error);
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_product',
      entityType: 'produto',
      entityId: productId,
      details: { action: 'delete' }
    });
    
    toast.success('Produto excluído com sucesso');
    return true;
  } catch (error) {
    console.error('[AdminProductActions] Error deleting product:', error);
    toast.error('Erro ao excluir produto');
    return false;
  }
};
