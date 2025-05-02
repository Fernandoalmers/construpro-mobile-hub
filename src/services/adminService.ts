
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface LogAdminActionParams {
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
}

export const logAdminAction = async ({
  action,
  entityType,
  entityId,
  details
}: LogAdminActionParams): Promise<boolean> => {
  try {
    // Call the Supabase RPC function to log the admin action
    const { data, error } = await supabase.rpc('log_admin_action', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });

    if (error) {
      console.error('Error logging admin action:', error);
      toast.error('Erro ao registrar ação administrativa');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logAdminAction:', error);
    return false;
  }
};

export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getAdminLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    throw error;
  }
};
