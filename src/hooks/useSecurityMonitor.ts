import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  user_id?: string;
  ip_address?: string;
}

interface SecurityMonitorResult {
  success: boolean;
  alerts?: SecurityAlert[];
  error?: string;
  [key: string]: any;
}

export const useSecurityMonitor = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkSuspiciousActivity = async (timeWindowHours: number = 1): Promise<SecurityMonitorResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: {
          action: 'check_suspicious_activity',
          time_window: timeWindowHours * 3600000 // Convert to milliseconds
        }
      });

      if (error) throw error;

      // Show toast notifications for critical alerts
      if (data.alerts) {
        const criticalAlerts = data.alerts.filter((alert: SecurityAlert) => 
          alert.severity === 'critical'
        );
        
        if (criticalAlerts.length > 0) {
          toast.error(`${criticalAlerts.length} alerta(s) crítico(s) de segurança detectado(s)!`);
        }
      }

      return data;
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      toast.error('Erro ao verificar atividade suspeita');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const auditSecurityEvents = async (days: number = 7, eventTypes: string[] = []): Promise<SecurityMonitorResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: {
          action: 'audit_security_events',
          days,
          event_types: eventTypes
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error auditing security events:', error);
      toast.error('Erro ao auditar eventos de segurança');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupZipCache = async (): Promise<SecurityMonitorResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: {
          action: 'cleanup_zip_cache'
        }
      });

      if (error) throw error;

      if (data.entries_cleaned > 0) {
        toast.success(`${data.entries_cleaned} entrada(s) suspeita(s) removida(s) do cache de CEP`);
      } else {
        toast.info('Nenhuma entrada suspeita encontrada no cache de CEP');
      }

      return data;
    } catch (error) {
      console.error('Error cleaning ZIP cache:', error);
      toast.error('Erro ao limpar cache de CEP');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const validateSystemIntegrity = async (): Promise<SecurityMonitorResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-monitor', {
        body: {
          action: 'validate_system_integrity'
        }
      });

      if (error) throw error;

      if (data.issues_found > 0) {
        toast.warning(`${data.issues_found} problema(s) de integridade encontrado(s)`);
      } else {
        toast.success('Sistema íntegro - nenhum problema encontrado');
      }

      return data;
    } catch (error) {
      console.error('Error validating system integrity:', error);
      toast.error('Erro ao validar integridade do sistema');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    checkSuspiciousActivity,
    auditSecurityEvents,
    cleanupZipCache,
    validateSystemIntegrity
  };
};