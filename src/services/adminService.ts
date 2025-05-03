
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
    // Call the RPC function to log admin action
    const { error } = await supabase.rpc('log_admin_action', {
      action: logData.action,
      entity_type: logData.entityType,
      entity_id: logData.entityId,
      details: logData.details || null
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error logging admin action:', error);
    toast.error('Erro ao registrar ação administrativa');
    return false;
  }
};
