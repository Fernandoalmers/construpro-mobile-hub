import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/admin';
import { logAdminAction } from './adminService';
import { adminSecurityService } from './adminSecurityService';
import { toast } from '@/components/ui/sonner';

// FUNÇÃO ANTIGA - NÃO USAR MAIS
// Esta função foi substituída pela versão em /admin/users/usersFetcher.ts
export const fetchUsers_OLD = async (): Promise<UserData[]> => {
  console.warn('⚠️ [fetchUsers_OLD] Esta função está obsoleta. Use fetchUsers de /admin/users/index.ts');
  try {
    // Verificar se o usuário atual é admin antes de permitir a consulta
    const isAdmin = await adminSecurityService.isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('🚫 [fetchUsers_OLD] Unauthorized access attempt');
      toast.error('Acesso negado: Apenas administradores podem visualizar usuários');
      return [];
    }

    console.log('🔍 [fetchUsers_OLD] Admin verified, fetching users');

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

    console.log(`✅ [fetchUsers_OLD] Retrieved ${combinedData.length} users`);
    return combinedData;
  } catch (error) {
    console.error('❌ [fetchUsers_OLD] Error:', error);
    toast.error('Erro ao carregar usuários');
    return [];
  }
};

// Re-exportar da nova localização
export { fetchUsers } from './admin/users/index';

export const approveUser = async (userId: string): Promise<boolean> => {
  try {
    // Verificar permissões de admin
    const isAdmin = await adminSecurityService.isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('🚫 [approveUser] Unauthorized approval attempt');
      toast.error('Acesso negado: Apenas administradores podem aprovar usuários');
      return false;
    }

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
    console.error('❌ [approveUser] Error:', error);
    toast.error('Erro ao aprovar usuário');
    return false;
  }
};

export const rejectUser = async (userId: string): Promise<boolean> => {
  try {
    // Verificar permissões de admin
    const isAdmin = await adminSecurityService.isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('🚫 [rejectUser] Unauthorized rejection attempt');
      toast.error('Acesso negado: Apenas administradores podem recusar usuários');
      return false;
    }

    // In a real app, update the user status in database
    // For now we'll just return success
    
    toast.success('Usuário recusado');
    return true;
  } catch (error) {
    console.error('❌ [rejectUser] Error:', error);
    toast.error('Erro ao recusar usuário');
    return false;
  }
};

export const blockUser = async (userId: string): Promise<boolean> => {
  try {
    // Verificar permissões de admin
    const isAdmin = await adminSecurityService.isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('🚫 [blockUser] Unauthorized block attempt');
      toast.error('Acesso negado: Apenas administradores podem bloquear usuários');
      return false;
    }

    await logAdminAction({
      action: 'block_user',
      entityType: 'user',
      entityId: userId
    });
    
    toast.success('Usuário bloqueado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [blockUser] Error:', error);
    toast.error('Erro ao bloquear usuário');
    return false;
  }
};

export const unblockUser = async (userId: string): Promise<boolean> => {
  try {
    // Verificar permissões de admin
    const isAdmin = await adminSecurityService.isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('🚫 [unblockUser] Unauthorized unblock attempt');
      toast.error('Acesso negado: Apenas administradores podem desbloquear usuários');
      return false;
    }

    await logAdminAction({
      action: 'unblock_user',
      entityType: 'user',
      entityId: userId
    });
    
    toast.success('Usuário desbloqueado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [unblockUser] Error:', error);
    toast.error('Erro ao desbloquear usuário');
    return false;
  }
};

export const makeAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Usar o serviço seguro para promover usuário
    return await adminSecurityService.promoteUserToAdmin(userId, 'Admin promotion via user management');
  } catch (error) {
    console.error('❌ [makeAdmin] Error:', error);
    toast.error('Erro ao promover usuário a administrador');
    return false;
  }
};

export const removeAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Usar o serviço seguro para remover privilégios
    return await adminSecurityService.demoteUserFromAdmin(userId, 'Admin demotion via user management');
  } catch (error) {
    console.error('❌ [removeAdmin] Error:', error);
    toast.error('Erro ao remover privilégios de administrador');
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
    return false;
  }
  
  try {
    // Verificar permissões de admin
    const isAdmin = await adminSecurityService.isCurrentUserAdmin();
    if (!isAdmin) {
      console.error('🚫 [deleteUser] Unauthorized deletion attempt');
      toast.error('Acesso negado: Apenas administradores podem excluir usuários');
      return false;
    }

    // In a real app, delete the user from database
    // For now we'll just return success
    
    toast.success('Usuário excluído com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [deleteUser] Error:', error);
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
