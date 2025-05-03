
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '@/services/adminService';

/**
 * Approve a store by ID
 */
export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('[StoreStatusManager] Approving store:', storeId);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select();
    
    if (error) {
      console.error('[StoreStatusManager] Error approving store:', error);
      toast.error('Erro ao aprovar loja: ' + error.message);
      return false;
    }
    
    console.log('[StoreStatusManager] Store approval result:', data);
    
    // Log admin action
    try {
      await logAdminAction({
        action: 'approve',
        entityType: 'store',
        entityId: storeId
      });
    } catch (logError) {
      console.error('[StoreStatusManager] Error logging admin action:', logError);
      // Non-blocking error - store was still approved
    }
    
    toast.success('Loja aprovada com sucesso!');
    return true;
  } catch (error) {
    console.error('[StoreStatusManager] Unexpected error approving store:', error);
    toast.error('Erro inesperado ao aprovar loja');
    return false;
  }
};

/**
 * Reject/deactivate a store by ID
 */
export const rejectStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('[StoreStatusManager] Rejecting/deactivating store:', storeId);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', storeId)
      .select();
    
    if (error) {
      console.error('[StoreStatusManager] Error rejecting store:', error);
      toast.error('Erro ao rejeitar loja: ' + error.message);
      return false;
    }
    
    console.log('[StoreStatusManager] Store rejection result:', data);
    
    // Log admin action
    try {
      await logAdminAction({
        action: 'reject', 
        entityType: 'store', 
        entityId: storeId
      });
    } catch (logError) {
      console.error('[StoreStatusManager] Error logging admin action:', logError);
      // Non-blocking error - store was still rejected
    }
    
    toast.success('Loja rejeitada com sucesso!');
    return true;
  } catch (error) {
    console.error('[StoreStatusManager] Unexpected error rejecting store:', error);
    toast.error('Erro inesperado ao rejeitar loja');
    return false;
  }
};

/**
 * Delete a store by ID
 */
export const deleteStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('[StoreStatusManager] Deleting store:', storeId);
    
    const { error } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', storeId);
    
    if (error) {
      console.error('[StoreStatusManager] Error deleting store:', error);
      toast.error('Erro ao excluir loja: ' + error.message);
      return false;
    }
    
    // Log admin action
    try {
      await logAdminAction({
        action: 'delete',
        entityType: 'store',
        entityId: storeId
      });
    } catch (logError) {
      console.error('[StoreStatusManager] Error logging admin action:', logError);
      // Non-blocking error - store was still deleted
    }
    
    toast.success('Loja excluída com sucesso!');
    return true;
  } catch (error) {
    console.error('[StoreStatusManager] Unexpected error deleting store:', error);
    toast.error('Erro inesperado ao excluir loja');
    return false;
  }
};
