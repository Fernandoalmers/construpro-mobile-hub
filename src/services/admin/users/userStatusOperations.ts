
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '@/services/adminService';

export const approveUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'ativo' })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_user',
      entityType: 'usuario',
      entityId: userId,
      details: { status: 'ativo' }
    });
    
    toast.success('Usuário aprovado com sucesso');
    return true;
  } catch (error) {
    console.error('Error approving user:', error);
    toast.error('Erro ao aprovar usuário');
    return false;
  }
};

export const rejectUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'recusado' })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_user',
      entityType: 'usuario',
      entityId: userId,
      details: { status: 'recusado' }
    });
    
    toast.success('Usuário recusado');
    return true;
  } catch (error) {
    console.error('Error rejecting user:', error);
    toast.error('Erro ao recusar usuário');
    return false;
  }
};

export const blockUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'bloqueado' })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'block_user',
      entityType: 'usuario',
      entityId: userId,
      details: { status: 'bloqueado' }
    });
    
    toast.success('Usuário bloqueado com sucesso');
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    toast.error('Erro ao bloquear usuário');
    return false;
  }
};

export const unblockUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'ativo' })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'unblock_user',
      entityType: 'usuario',
      entityId: userId,
      details: { status: 'ativo' }
    });
    
    toast.success('Usuário desbloqueado com sucesso');
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    toast.error('Erro ao desbloquear usuário');
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // Não podemos excluir diretamente da tabela auth.users pelo RLS
    // Então vamos apenas marcar o usuário como excluído na tabela profiles
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'excluido' })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_user',
      entityType: 'usuario',
      entityId: userId
    });
    
    toast.success('Usuário marcado como excluído');
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Erro ao excluir usuário');
    return false;
  }
};
