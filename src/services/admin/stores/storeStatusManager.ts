
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '@/services/adminService';

/**
 * Approve a store by ID
 */
export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('[StoreStatusManager] Starting approval for store:', storeId);
    
    // Validate storeId
    if (!storeId || storeId.trim() === '') {
      console.error('[StoreStatusManager] Invalid store ID provided');
      toast.error('ID da loja inválido');
      return false;
    }

    // Check if it's an incomplete store
    if (storeId.startsWith('incomplete-')) {
      console.error('[StoreStatusManager] Cannot approve incomplete store:', storeId);
      toast.error('Não é possível aprovar uma loja com registro incompleto');
      return false;
    }
    
    // First, check if the store exists
    const { data: existingStore, error: checkError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, status')
      .eq('id', storeId)
      .single();
    
    if (checkError) {
      console.error('[StoreStatusManager] Error checking store existence:', checkError);
      toast.error('Erro ao verificar loja: ' + checkError.message);
      return false;
    }
    
    if (!existingStore) {
      console.error('[StoreStatusManager] Store not found in vendedores table:', storeId);
      toast.error('Loja não encontrada');
      return false;
    }
    
    console.log('[StoreStatusManager] Store found:', existingStore);
    
    // Update the store status
    const { data, error } = await supabase
      .from('vendedores')
      .update({ 
        status: 'aprovado', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', storeId)
      .select();
    
    if (error) {
      console.error('[StoreStatusManager] Error updating store status:', error);
      toast.error('Erro ao aprovar loja: ' + error.message);
      return false;
    }
    
    console.log('[StoreStatusManager] Store approval successful:', data);
    
    // Verify the update was successful
    if (!data || data.length === 0) {
      console.error('[StoreStatusManager] No rows were updated');
      toast.error('Nenhuma loja foi atualizada');
      return false;
    }
    
    // Double-check the status was actually changed
    const { data: verifyData, error: verifyError } = await supabase
      .from('vendedores')
      .select('status')
      .eq('id', storeId)
      .single();
    
    if (verifyError) {
      console.error('[StoreStatusManager] Error verifying update:', verifyError);
    } else {
      console.log('[StoreStatusManager] Verified status after update:', verifyData?.status);
    }
    
    // Log admin action
    try {
      await logAdminAction({
        action: 'approve',
        entityType: 'store',
        entityId: storeId
      });
      console.log('[StoreStatusManager] Admin action logged successfully');
    } catch (logError) {
      console.error('[StoreStatusManager] Error logging admin action:', logError);
      // Non-blocking error - store was still approved
    }
    
    toast.success('Loja aprovada com sucesso!');
    console.log('[StoreStatusManager] Store approval process completed successfully');
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
    console.log('[StoreStatusManager] Starting rejection for store:', storeId);
    
    // Validate storeId
    if (!storeId || storeId.trim() === '') {
      console.error('[StoreStatusManager] Invalid store ID provided');
      toast.error('ID da loja inválido');
      return false;
    }

    // Check if it's an incomplete store
    if (storeId.startsWith('incomplete-')) {
      console.error('[StoreStatusManager] Cannot reject incomplete store:', storeId);
      toast.error('Não é possível rejeitar uma loja com registro incompleto');
      return false;
    }
    
    // First, check if the store exists
    const { data: existingStore, error: checkError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, status')
      .eq('id', storeId)
      .single();
    
    if (checkError) {
      console.error('[StoreStatusManager] Error checking store existence:', checkError);
      toast.error('Erro ao verificar loja: ' + checkError.message);
      return false;
    }
    
    if (!existingStore) {
      console.error('[StoreStatusManager] Store not found in vendedores table:', storeId);
      toast.error('Loja não encontrada');
      return false;
    }
    
    console.log('[StoreStatusManager] Store found:', existingStore);
    
    // Update the store status
    const { data, error } = await supabase
      .from('vendedores')
      .update({ 
        status: 'inativo', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', storeId)
      .select();
    
    if (error) {
      console.error('[StoreStatusManager] Error updating store status:', error);
      toast.error('Erro ao rejeitar loja: ' + error.message);
      return false;
    }
    
    console.log('[StoreStatusManager] Store rejection successful:', data);
    
    // Verify the update was successful
    if (!data || data.length === 0) {
      console.error('[StoreStatusManager] No rows were updated');
      toast.error('Nenhuma loja foi atualizada');
      return false;
    }
    
    // Double-check the status was actually changed
    const { data: verifyData, error: verifyError } = await supabase
      .from('vendedores')
      .select('status')
      .eq('id', storeId)
      .single();
    
    if (verifyError) {
      console.error('[StoreStatusManager] Error verifying update:', verifyError);
    } else {
      console.log('[StoreStatusManager] Verified status after update:', verifyData?.status);
    }
    
    // Log admin action
    try {
      await logAdminAction({
        action: 'reject', 
        entityType: 'store', 
        entityId: storeId
      });
      console.log('[StoreStatusManager] Admin action logged successfully');
    } catch (logError) {
      console.error('[StoreStatusManager] Error logging admin action:', logError);
      // Non-blocking error - store was still rejected
    }
    
    toast.success('Loja rejeitada com sucesso!');
    console.log('[StoreStatusManager] Store rejection process completed successfully');
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
