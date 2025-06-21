
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useIsAdmin = () => {
  const { user, isAuthenticated, session, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔐 [useIsAdmin] Starting admin check for user:', user?.id);
      console.log('🔐 [useIsAdmin] Profile from context:', profile);
      
      if (!isAuthenticated || !user || !session) {
        console.log('🔐 [useIsAdmin] User not authenticated');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Method 1: Check profile from context first (fastest)
        if (profile?.is_admin) {
          console.log('🔐 [useIsAdmin] Admin status from profile context: true');
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Method 2: Direct profile query (most reliable)
        console.log('🔐 [useIsAdmin] Checking admin status with direct profile query');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin, papel, nome, email')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('🔐 [useIsAdmin] Profile query error:', profileError);
        } else {
          console.log('🔐 [useIsAdmin] Profile data from direct query:', profileData);
          if (profileData?.is_admin) {
            console.log('🔐 [useIsAdmin] Admin status confirmed via direct query');
            setIsAdmin(true);
            setIsLoading(false);
            return;
          }
        }

        // Method 3: Try RPC as fallback
        console.log('🔐 [useIsAdmin] Trying RPC function as fallback');
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('is_admin');
          
          console.log('🔐 [useIsAdmin] RPC result:', rpcResult);
          console.log('🔐 [useIsAdmin] RPC error:', rpcError);
          
          if (!rpcError && rpcResult) {
            console.log('🔐 [useIsAdmin] Admin status confirmed via RPC');
            setIsAdmin(true);
            setIsLoading(false);
            return;
          }
        } catch (rpcError) {
          console.warn('🔐 [useIsAdmin] RPC function failed:', rpcError);
        }

        // If all methods fail, user is not admin
        console.log('🔐 [useIsAdmin] All verification methods completed - user is not admin');
        setIsAdmin(false);
        
      } catch (error) {
        console.error('🔐 [useIsAdmin] Exception during admin check:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated, session, profile]);

  console.log('🔐 [useIsAdmin] Hook returning:', { isAdmin, isLoading });
  return { isAdmin, isLoading };
};
