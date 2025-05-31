import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';
import { UserData } from '@/types/admin';

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    // Buscar dados dos profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) throw profilesError;
    
    // Para cada usuário, buscar dados adicionais
    const enrichedUsers = await Promise.all(
      profilesData.map(async (user) => {
        // Buscar quem indicou este usuário
        const { data: referralData } = await supabase
          .from('referrals')
          .select(`
            referrer_id,
            profiles!referrals_referrer_id_fkey(nome)
          `)
          .eq('referred_id', user.id)
          .single();

        // Calcular total de compras do usuário
        const { data: ordersData } = await supabase
          .from('orders')
          .select('valor_total')
          .eq('cliente_id', user.id);

        const totalCompras = ordersData?.reduce((total, order) => total + (order.valor_total || 0), 0) || 0;

        return {
          id: user.id,
          nome: user.nome || 'Sem nome',
          email: user.email || 'Sem email',
          papel: user.papel || user.tipo_perfil || 'consumidor',
          tipo_perfil: user.tipo_perfil || user.papel || 'consumidor',
          status: user.status || 'ativo',
          cpf: user.cpf || '',
          telefone: user.telefone || '',
          avatar: user.avatar || null,
          is_admin: user.is_admin || false,
          saldo_pontos: user.saldo_pontos || 0,
          created_at: user.created_at,
          // Novos campos
          codigo_indicacao: user.codigo || '',
          indicado_por: referralData?.profiles?.nome || '',
          especialidade: user.especialidade_profissional || '',
          total_compras: totalCompras
        };
      })
    );
    
    return enrichedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Erro ao buscar usuários');
    throw error;
  }
};

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

export const makeAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'make_admin',
      entityType: 'usuario',
      entityId: userId,
      details: { is_admin: true }
    });
    
    toast.success('Usuário promovido a administrador');
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    toast.error('Erro ao promover usuário a administrador');
    return false;
  }
};

export const removeAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('id', userId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'remove_admin',
      entityType: 'usuario',
      entityId: userId,
      details: { is_admin: false }
    });
    
    toast.success('Privilégios de administrador removidos');
    return true;
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    toast.error('Erro ao remover privilégios de administrador');
    return false;
  }
};

export const getRoleBadgeColor = (role: string): string => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'lojista':
    case 'vendedor':
      return 'bg-purple-100 text-purple-800';
    case 'profissional':
      return 'bg-blue-100 text-blue-800';
    case 'consumidor':
    default:
      return 'bg-green-100 text-green-700';
  }
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'bloqueado':
    case 'recusado':
      return 'bg-red-100 text-red-800';
    case 'inativo':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
