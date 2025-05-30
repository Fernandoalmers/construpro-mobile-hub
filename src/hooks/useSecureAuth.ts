
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { securityService } from '@/services/securityService';
import { config } from '@/config/environment';

export const useSecureAuth = () => {
  const { user, profile } = useAuth();
  const [sessionValid, setSessionValid] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Check session timeout
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > config.security.sessionTimeoutMs) {
        setSessionValid(false);
        securityService.logSecurityEvent('session_timeout', {
          user_id: user.id,
          last_activity: new Date(lastActivity).toISOString()
        });
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, lastActivity]);

  return {
    sessionValid,
    isAuthenticated: !!user && sessionValid,
    isAdmin: profile?.is_admin || false,
    lastActivity: new Date(lastActivity)
  };
};
