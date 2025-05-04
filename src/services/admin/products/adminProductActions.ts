
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { logAdminAction } from '@/services/adminService';

/**
 * Approve a product by ID
 */
export const approveProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[AdminProductActions] Approving product:', productId);
    
    const { data, error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado' })
      .eq('id', productId)
      .select();
    
    console.log('[AdminProductActions] Approve result:', data, error);
    
    if (error) {
      console.error('[AdminProductActions] Error approving product:', error);
      toast({
        title: "Error",
        description: `Erro ao aprovar produto: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    // Log the admin action
    try {
      await logAdminAction({
        action: 'approve',
        entityType: 'product',
        entityId: productId
      });
    } catch (logError) {
      console.error('[AdminProductActions] Error logging admin action:', logError);
      // Non-blocking error - product was still approved
    }
    
    return true;
  } catch (error) {
    console.error('[AdminProductActions] Unexpected error in approveProduct:', error);
    toast({
      title: "Error",
      description: "Erro inesperado ao aprovar produto",
      variant: "destructive"
    });
    return false;
  }
};

/**
 * Reject a product by ID (set status to inactive)
 */
export const rejectProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[AdminProductActions] Rejecting product:', productId);
    
    const { data, error } = await supabase
      .from('produtos')
      .update({ status: 'inativo' })
      .eq('id', productId)
      .select();
    
    console.log('[AdminProductActions] Reject result:', data, error);
    
    if (error) {
      console.error('[AdminProductActions] Error rejecting product:', error);
      toast({
        title: "Error",
        description: `Erro ao rejeitar produto: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    // Log the admin action
    try {
      await logAdminAction({
        action: 'reject',
        entityType: 'product',
        entityId: productId
      });
    } catch (logError) {
      console.error('[AdminProductActions] Error logging admin action:', logError);
      // Non-blocking error - product was still rejected
    }
    
    return true;
  } catch (error) {
    console.error('[AdminProductActions] Unexpected error in rejectProduct:', error);
    toast({
      title: "Error",
      description: "Erro inesperado ao rejeitar produto",
      variant: "destructive"
    });
    return false;
  }
};
