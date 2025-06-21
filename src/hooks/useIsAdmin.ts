
import { useState, useEffect } from 'react';
import { securityService } from '@/services/securityService';
import { useAuth } from '@/context/AuthContext';

export const useIsAdmin = () => {
  const { user, isAuthenticated, session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔐 [useIsAdmin] Checking admin status for user:', user?.id);
      
      if (!isAuthenticated || !user || !session) {
        console.log('🔐 [useIsAdmin] User not authenticated');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // First check the profile directly from context
        const profileAdmin = (user as any)?.is_admin || false;
        console.log('🔐 [useIsAdmin] Profile admin status:', profileAdmin);
        
        // Then verify with security service
        const adminStatus = await securityService.isCurrentUserAdmin();
        console.log('🔐 [useIsAdmin] Security service admin status:', adminStatus);
        
        // Use the security service result as primary source
        setIsAdmin(adminStatus);
        
        if (profileAdmin !== adminStatus) {
          console.warn('🔐 [useIsAdmin] Mismatch between profile and security service:', {
            profile: profileAdmin,
            securityService: adminStatus
          });
        }
        
      } catch (error) {
        console.error('🔐 [useIsAdmin] Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated, session]);

  return { isAdmin, isLoading };
};
