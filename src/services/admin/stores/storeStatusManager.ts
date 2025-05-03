
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '../../adminService';

/**
 * Approve a store
 */
export const approveStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('Approving store with ID:', storeId);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error approving store:', error);
      throw error;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_store',
      entityType: 'vendedor',
      entityId: storeId,
      details: { status: 'aprovado' }
    });
    
    toast.success('Loja aprovada com sucesso');
    return true;
  } catch (error) {
    console.error('Error approving store:', error);
    toast.error('Erro ao aprovar loja');
    return false;
  }
};

/**
 * Reject a store
 */
export const rejectStore = async (storeId: string): Promise<boolean> => {
  try {
    console.log('Rejecting store with ID:', storeId);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', storeId);
      
    if (error) {
      console.error('Error rejecting store:', error);
      throw error;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_store',
      entityType: 'vendedor',
      entityId: storeId,
      details: { status: 'inativo' }
    });
    
    toast.success('Loja rejeitada com sucesso');
    return true;
  } catch (error) {
    console.error('Error rejecting store:', error);
    toast.error('Erro ao rejeitar loja');
    return false;
  }
};

/**
 * Delete a store
 */
export const deleteStore = async (storeId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .delete()
      .eq('id', storeId);
      
    if (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_store',
      entityType: 'vendedor',
      entityId: storeId,
      details: { action: 'delete' }
    });
    
    toast.success('Loja excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting store:', error);
    toast.error('Erro ao excluir loja');
    return false;
  }
};
