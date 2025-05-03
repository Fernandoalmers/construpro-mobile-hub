import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/admin';
import { logAdminAction } from './adminService';
import { toast } from '@/components/ui/sonner';

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    // Get profile data from Supabase
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      throw profilesError;
    }

    // For now, we'll merge with our mock data to get additional fields
    // In a real app, these would all be in your database
    const mockData = (await import('../data/clientes.json')).default;

    // Combine data sources
    const combinedData = profilesData.map((profile: any) => {
      // Find matching mock data
      const mockUser = mockData.find(mock => mock.id === profile.id);
      
      // Return combined object with appropriate defaults
      return {
        ...mockUser,
        ...profile,
        nome: profile.nome || mockUser?.nome || 'Usuário',
        papel: profile.papel || 'consumidor', // Default to consumidor if papel doesn't exist
        saldoPontos: profile.saldo_pontos || mockUser?.saldoPontos || 0,
        status: 'ativo' // Default status
      };
    });

    return combinedData;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Erro ao carregar usuários');
    return [];
  }
};

export const approveUser = async (userId: string): Promise<boolean> => {
  try {
    // In a real app, update the user status in database
    // For now we'll just return success
    
    // Log admin action - in real app, call Supabase RPC
    await logAdminAction({
      action: 'approve_user',
      entityType: 'user',
      entityId: userId
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
    // In a real app, update the user status in database
    // For now we'll just return success
    
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
    // In a real app, update the user status in database
    // For now we'll just return success
    
    await logAdminAction({
      action: 'block_user',
      entityType: 'user',
      entityId: userId
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
    // In a real app, update the user status in database
    // For now we'll just return success
    
    await logAdminAction({
      action: 'unblock_user',
      entityType: 'user',
      entityId: userId
    });
    
    toast.success('Usuário desbloqueado com sucesso');
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    toast.error('Erro ao desbloquear usuário');
    return false;
  }
};

export const makeAdmin = async (userId: string): Promise<boolean> => {
  try {
    // In a real app, update the user admin status in database
    // For now we'll just return success
    
    await logAdminAction({
      action: 'make_admin',
      entityType: 'user',
      entityId: userId
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
    // In a real app, update the user admin status in database
    // For now we'll just return success
    
    await logAdminAction({
      action: 'remove_admin',
      entityType: 'user',
      entityId: userId
    });
    
    toast.success('Privilégios de administrador removidos');
    return true;
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    toast.error('Erro ao remover privilégios de administrador');
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
    return false;
  }
  
  try {
    // In a real app, delete the user from database
    // For now we'll just return success
    
    toast.success('Usuário excluído com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Erro ao excluir usuário');
    return false;
  }
};

export const getRoleBadgeColor = (role: string): string => {
  switch(role) {
    case 'profissional': return 'bg-blue-100 text-blue-800';
    case 'lojista': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusBadgeColor = (status: string): string => {
  switch(status) {
    case 'ativo': return 'bg-green-100 text-green-800';
    case 'pendente': return 'bg-amber-100 text-amber-800';
    case 'recusado': return 'bg-red-100 text-red-800';
    case 'bloqueado': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
