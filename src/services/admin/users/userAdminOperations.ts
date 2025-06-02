
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '@/services/adminService';
import { securityService } from '@/services/securityService';

export const makeAdmin = async (userId: string): Promise<boolean> => {
  try {
    const result = await securityService.promoteUserToAdmin(userId, 'Admin promotion via user management');
    
    if (result.success) {
      // Log the admin action
      await logAdminAction({
        action: 'make_admin',
        entityType: 'usuario',
        entityId: userId,
        details: { is_admin: true }
      });
      
      return true;
    } else {
      console.error('Failed to promote user to admin:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error making user admin:', error);
    toast.error('Erro ao promover usuário a administrador');
    return false;
  }
};

export const removeAdmin = async (userId: string): Promise<boolean> => {
  try {
    const result = await securityService.demoteUserFromAdmin(userId, 'Admin demotion via user management');
    
    if (result.success) {
      // Log the admin action
      await logAdminAction({
        action: 'remove_admin',
        entityType: 'usuario',
        entityId: userId,
        details: { is_admin: false }
      });
      
      return true;
    } else {
      console.error('Failed to demote user from admin:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    toast.error('Erro ao remover privilégios de administrador');
    return false;
  }
};
