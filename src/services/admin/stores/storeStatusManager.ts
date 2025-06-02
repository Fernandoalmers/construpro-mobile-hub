import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
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
      toast({
        title: "Erro",
        description: "ID da loja inválido",
        variant: "destructive"
      });
      return false;
    }

    // Check if it's an incomplete store
    if (storeId.startsWith('incomplete-')) {
      console.error('[StoreStatusManager] Cannot approve incomplete store:', storeId);
      toast({
        title: "Ação não permitida",
        description: "Não é possível aprovar uma loja com registro incompleto",
        variant: "destructive"
      });
      return false;
    }
    
    // First, check if the store exists and get current status
    const { data: existingStore, error: checkError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, status, usuario_id')
      .eq('id', storeId)
      .single();
    
    if (checkError) {
      console.error('[StoreStatusManager] Error checking store existence:', checkError);
      toast({
        title: "Erro",
        description: `Erro ao verificar loja: ${checkError.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    if (!existingStore) {
      console.error('[StoreStatusManager] Store not found in vendedores table:', storeId);
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('[StoreStatusManager] Store found:', existingStore);
    
    // Check if store is already approved
    if (existingStore.status === 'aprovado' || existingStore.status === 'ativo') {
      console.log('[StoreStatusManager] Store already approved:', existingStore.status);
      toast({
        title: "Informação",
        description: "Esta loja já está aprovada",
        variant: "default"
      });
      return true; // Return true as the desired state is already achieved
    }
    
    // Update the store status with explicit timestamp
    const updateData = { 
      status: 'aprovado', 
      updated_at: new Date().toISOString() 
    };
    
    console.log('[StoreStatusManager] Updating store with data:', updateData);
    
    const { data, error, count } = await supabase
      .from('vendedores')
      .update(updateData)
      .eq('id', storeId)
      .select('id, status, updated_at');
    
    if (error) {
      console.error('[StoreStatusManager] Error updating store status:', error);
      toast({
        title: "Erro",
        description: `Erro ao aprovar loja: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    console.log('[StoreStatusManager] Update result - data:', data, 'count:', count);
    
    // Verify the update was successful
    if (!data || data.length === 0) {
      console.error('[StoreStatusManager] No rows were updated - checking permissions');
      
      // Additional check to see if it's a permission issue
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('[StoreStatusManager] Current user:', currentUser?.user?.id);
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser?.user?.id)
        .single();
      
      console.log('[StoreStatusManager] User admin status:', profile?.is_admin);
      
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da loja. Verifique suas permissões.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('[StoreStatusManager] Store approval successful:', data[0]);
    
    // Double-check the status was actually changed
    const { data: verifyData, error: verifyError } = await supabase
      .from('vendedores')
      .select('id, status, updated_at')
      .eq('id', storeId)
      .single();
    
    if (verifyError) {
      console.error('[StoreStatusManager] Error verifying update:', verifyError);
    } else {
      console.log('[StoreStatusManager] Verified status after update:', verifyData);
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
    
    toast({
      title: "Sucesso",
      description: "Loja aprovada com sucesso!",
      variant: "default"
    });
    console.log('[StoreStatusManager] Store approval process completed successfully');
    return true;
  } catch (error) {
    console.error('[StoreStatusManager] Unexpected error approving store:', error);
    toast({
      title: "Erro",
      description: "Erro inesperado ao aprovar loja",
      variant: "destructive"
    });
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
      toast({
        title: "Erro",
        description: "ID da loja inválido",
        variant: "destructive"
      });
      return false;
    }

    // Check if it's an incomplete store
    if (storeId.startsWith('incomplete-')) {
      console.error('[StoreStatusManager] Cannot reject incomplete store:', storeId);
      toast({
        title: "Ação não permitida",
        description: "Não é possível rejeitar uma loja com registro incompleto",
        variant: "destructive"
      });
      return false;
    }
    
    // First, check if the store exists
    const { data: existingStore, error: checkError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, status, usuario_id')
      .eq('id', storeId)
      .single();
    
    if (checkError) {
      console.error('[StoreStatusManager] Error checking store existence:', checkError);
      toast({
        title: "Erro",
        description: `Erro ao verificar loja: ${checkError.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    if (!existingStore) {
      console.error('[StoreStatusManager] Store not found in vendedores table:', storeId);
      toast({
        title: "Erro",
        description: "Loja não encontrada",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('[StoreStatusManager] Store found:', existingStore);
    
    // Check if store is already inactive
    if (existingStore.status === 'inativo') {
      console.log('[StoreStatusManager] Store already inactive');
      toast({
        title: "Informação",
        description: "Esta loja já está inativa",
        variant: "default"
      });
      return true; // Return true as the desired state is already achieved
    }
    
    // Update the store status
    const updateData = { 
      status: 'inativo', 
      updated_at: new Date().toISOString() 
    };
    
    console.log('[StoreStatusManager] Updating store with data:', updateData);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update(updateData)
      .eq('id', storeId)
      .select('id, status, updated_at');
    
    if (error) {
      console.error('[StoreStatusManager] Error updating store status:', error);
      toast({
        title: "Erro",
        description: `Erro ao rejeitar loja: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    console.log('[StoreStatusManager] Store rejection successful:', data);
    
    // Verify the update was successful
    if (!data || data.length === 0) {
      console.error('[StoreStatusManager] No rows were updated');
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da loja. Verifique suas permissões.",
        variant: "destructive"
      });
      return false;
    }
    
    // Double-check the status was actually changed
    const { data: verifyData, error: verifyError } = await supabase
      .from('vendedores')
      .select('id, status, updated_at')
      .eq('id', storeId)
      .single();
    
    if (verifyError) {
      console.error('[StoreStatusManager] Error verifying update:', verifyError);
    } else {
      console.log('[StoreStatusManager] Verified status after update:', verifyData);
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
    
    toast({
      title: "Sucesso",
      description: "Loja rejeitada com sucesso!",
      variant: "default"
    });
    console.log('[StoreStatusManager] Store rejection process completed successfully');
    return true;
  } catch (error) {
    console.error('[StoreStatusManager] Unexpected error rejecting store:', error);
    toast({
      title: "Erro",
      description: "Erro inesperado ao rejeitar loja",
      variant: "destructive"
    });
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
