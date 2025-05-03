
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          return;
        }
        
        // Check if user is admin
        const { data, error } = await supabase
          .rpc('is_admin');
          
        if (error) throw error;
        
        setIsAdmin(!!data);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Falha ao verificar status de administrador');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);

  return { isAdmin, isLoading, error };
};
