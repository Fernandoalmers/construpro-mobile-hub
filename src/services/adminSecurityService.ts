
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface AdminPromotionLog {
  id: string;
  promoted_user_id: string;
  promoted_by_admin_id: string;
  action: 'promote' | 'demote';
  timestamp: string;
  reason?: string;
}

class AdminSecurityService {
  // Verificar se o usuário atual é admin de forma segura
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('❌ [AdminSecurity] No authenticated user');
        return false;
      }

      const { data, error } = await supabase.rpc('get_user_admin_status', {
        user_id: userData.user.id
      });
      
      if (error) {
        console.error('❌ [AdminSecurity] Error checking admin status:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('❌ [AdminSecurity] Exception checking admin status:', error);
      return false;
    }
  }

  // Promover usuário para admin (APENAS para admins existentes)
  async promoteUserToAdmin(userId: string, reason?: string): Promise<boolean> {
    try {
      // Verificar se o usuário atual é admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        console.error('🚫 [AdminSecurity] Unauthorized promotion attempt');
        toast.error('Acesso negado: Apenas administradores podem promover usuários');
        
        // Log da tentativa não autorizada
        await this.logSecurityViolation('unauthorized_promotion_attempt', userId);
        return false;
      }

      // Promover o usuário
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);

      if (error) {
        console.error('❌ [AdminSecurity] Error promoting user:', error);
        toast.error('Erro ao promover usuário');
        return false;
      }

      // Log da promoção
      await this.logAdminPromotion(userId, 'promote', reason);
      
      console.log(`✅ [AdminSecurity] User ${userId} promoted to admin`);
      toast.success('Usuário promovido a administrador com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [AdminSecurity] Exception promoting user:', error);
      toast.error('Erro interno ao promover usuário');
      return false;
    }
  }

  // Remover privilégios de admin (APENAS para admins existentes)
  async demoteUserFromAdmin(userId: string, reason?: string): Promise<boolean> {
    try {
      // Verificar se o usuário atual é admin
      const isAdmin = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        console.error('🚫 [AdminSecurity] Unauthorized demotion attempt');
        toast.error('Acesso negado: Apenas administradores podem remover privilégios');
        
        // Log da tentativa não autorizada
        await this.logSecurityViolation('unauthorized_demotion_attempt', userId);
        return false;
      }

      // Remover privilégios
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: false })
        .eq('id', userId);

      if (error) {
        console.error('❌ [AdminSecurity] Error demoting user:', error);
        toast.error('Erro ao remover privilégios');
        return false;
      }

      // Log da remoção
      await this.logAdminPromotion(userId, 'demote', reason);
      
      console.log(`✅ [AdminSecurity] User ${userId} demoted from admin`);
      toast.success('Privilégios de administrador removidos com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [AdminSecurity] Exception demoting user:', error);
      toast.error('Erro interno ao remover privilégios');
      return false;
    }
  }

  // Log de promoções/remoções de admin
  private async logAdminPromotion(userId: string, action: 'promote' | 'demote', reason?: string): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      await supabase.rpc('log_admin_action', {
        action: `${action}_admin`,
        entity_type: 'user',
        entity_id: userId,
        details: {
          action,
          target_user_id: userId,
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ [AdminSecurity] Error logging admin promotion:', error);
    }
  }

  // Log de violações de segurança
  private async logSecurityViolation(violation: string, targetUserId?: string): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      await supabase.rpc('log_admin_action', {
        action: 'security_violation',
        entity_type: 'security',
        entity_id: violation,
        details: {
          violation_type: violation,
          target_user_id: targetUserId,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      });
    } catch (error) {
      console.error('❌ [AdminSecurity] Error logging security violation:', error);
    }
  }

  // Verificar se um usuário específico é admin
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [AdminSecurity] Error checking user admin status:', error);
        return false;
      }

      return !!data?.is_admin;
    } catch (error) {
      console.error('❌ [AdminSecurity] Exception checking user admin status:', error);
      return false;
    }
  }
}

export const adminSecurityService = new AdminSecurityService();
