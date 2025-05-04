
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AdminLogData {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
}

export const fetchAdminLogs = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    toast.error('Erro ao carregar histórico de ações administrativas');
    return [];
  }
};

export const logAdminAction = async (logData: AdminLogData) => {
  try {
    console.log('[adminService] Logging admin action:', logData);
    
    // Call the RPC function to log admin action
    const { error } = await supabase.rpc('log_admin_action', {
      action: logData.action,
      entity_type: logData.entityType,
      entity_id: logData.entityId,
      details: logData.details || null
    });
    
    if (error) {
      console.error('[adminService] Error logging admin action:', error);
      throw error;
    }
    
    console.log('[adminService] Admin action logged successfully');
    return true;
  } catch (error) {
    console.error('[adminService] Error logging admin action:', error);
    // Don't show toast here as it might disrupt user flow for non-critical logging operations
    return false;
  }
};
