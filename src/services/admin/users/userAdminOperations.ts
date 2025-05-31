
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '@/services/adminService';

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
