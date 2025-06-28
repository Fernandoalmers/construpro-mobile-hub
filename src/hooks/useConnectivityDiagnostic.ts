
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectivityStatus {
  isOnline: boolean;
  supabaseHealthy: boolean;
  latency: number | null;
  lastCheck: Date | null;
}

export const useConnectivityDiagnostic = () => {
  const [status, setStatus] = useState<ConnectivityStatus>({
    isOnline: navigator.onLine,
    supabaseHealthy: false,
    latency: null,
    lastCheck: null
  });

  const checkSupabaseHealth = async (): Promise<{ healthy: boolean; latency: number }> => {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('product_segments')
        .select('count', { count: 'exact', head: true });
      
      const latency = Date.now() - startTime;
      
      return {
        healthy: !error,
        latency
      };
    } catch (error) {
      console.error('[ConnectivityDiagnostic] Supabase health check failed:', error);
      return {
        healthy: false,
        latency: Date.now() - startTime
      };
    }
  };

  const runDiagnostic = async () => {
    console.log('[ConnectivityDiagnostic] Running connectivity diagnostic...');
    
    const isOnline = navigator.onLine;
    const { healthy, latency } = await checkSupabaseHealth();
    
    setStatus({
      isOnline,
      supabaseHealthy: healthy,
      latency,
      lastCheck: new Date()
    });

    console.log('[ConnectivityDiagnostic] Diagnostic complete:', {
      isOnline,
      supabaseHealthy: healthy,
      latency: `${latency}ms`
    });
  };

  useEffect(() => {
    // Run initial diagnostic
    runDiagnostic();

    // Set up periodic health checks
    const interval = setInterval(runDiagnostic, 30000); // Every 30 seconds

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[ConnectivityDiagnostic] Network connection restored');
      runDiagnostic();
    };
    
    const handleOffline = () => {
      console.log('[ConnectivityDiagnostic] Network connection lost');
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    ...status,
    refresh: runDiagnostic
  };
};
