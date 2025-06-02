
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { securityService } from './securityService';

// Enhanced admin security service with proper RLS integration
export const adminSecurityService = {
  // Use the new secure function to check admin status
  async isCurrentUserAdmin(): Promise<boolean> {
    return await securityService.isCurrentUserAdmin();
  },

  // Secure admin promotion with enhanced logging
  async promoteUserToAdmin(userId: string, reason?: string): Promise<boolean> {
    console.log('🔐 [adminSecurityService] Attempting to promote user to admin:', userId);
    
    const result = await securityService.promoteUserToAdmin(userId, reason);
    
    if (result.success) {
      console.log('✅ [adminSecurityService] User promoted successfully');
      return true;
    } else {
      console.error('❌ [adminSecurityService] Failed to promote user:', result.error);
      return false;
    }
  },

  // Secure admin demotion with enhanced logging
  async demoteUserFromAdmin(userId: string, reason?: string): Promise<boolean> {
    console.log('🔐 [adminSecurityService] Attempting to demote user from admin:', userId);
    
    const result = await securityService.demoteUserFromAdmin(userId, reason);
    
    if (result.success) {
      console.log('✅ [adminSecurityService] User demoted successfully');
      return true;
    } else {
      console.error('❌ [adminSecurityService] Failed to demote user:', result.error);
      return false;
    }
  },

  // Verify admin access for sensitive operations
  async verifyAdminAccess(operation: string): Promise<boolean> {
    const isAdmin = await this.isCurrentUserAdmin();
    
    if (!isAdmin) {
      console.error('🚫 [adminSecurityService] Unauthorized admin operation attempt:', operation);
      await securityService.logSecurityEvent('unauthorized_admin_operation', {
        operation,
        timestamp: new Date().toISOString()
      });
      toast.error('Acesso negado: Apenas administradores podem realizar esta operação');
      return false;
    }

    await securityService.logSecurityEvent('admin_operation_authorized', {
      operation,
      timestamp: new Date().toISOString()
    });

    return true;
  },

  // Get security events (admin only)
  async getSecurityEvents(limit: number = 50): Promise<any[]> {
    try {
      if (!(await this.verifyAdminAccess('view_security_events'))) {
        return [];
      }

      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching security events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching security events:', error);
      return [];
    }
  },

  // Get admin logs (admin only)  
  async getAdminLogs(limit: number = 50): Promise<any[]> {
    try {
      if (!(await this.verifyAdminAccess('view_admin_logs'))) {
        return [];
      }

      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          profiles!admin_id (nome, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching admin logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching admin logs:', error);
      return [];
    }
  }
};
