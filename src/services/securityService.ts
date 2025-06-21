
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface SecurityEvent {
  event_type: string;
  details?: any;
  user_id?: string;
}

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; firstAttempt: number }>();

export const securityService = {
  // Rate limiting check
  checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = rateLimitStore.get(key);
    
    if (!existing) {
      rateLimitStore.set(key, { count: 1, firstAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - existing.firstAttempt > windowMs) {
      rateLimitStore.set(key, { count: 1, firstAttempt: now });
      return true;
    }
    
    // Check if limit exceeded
    if (existing.count >= maxAttempts) {
      return false;
    }
    
    // Increment count
    existing.count++;
    return true;
  },

  // Cart quantity validation
  validateCartQuantity(quantity: number): boolean {
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 1000;
  },

  // Log security events using the new secure function
  async logSecurityEvent(eventType: string, details: any = {}, userId?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        event_type: eventType,
        details: details,
        user_id_param: userId || null
      });

      if (error) {
        console.error('Error logging security event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception logging security event:', error);
      return false;
    }
  },

  // Simplified and more reliable admin check
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      console.log('🔐 [securityService] Checking admin status');
      
      // First verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('🔐 [securityService] No valid session:', sessionError);
        return false;
      }

      console.log('🔐 [securityService] Session valid, user ID:', session.user.id);

      // Primary method: Direct profile query (most reliable)
      console.log('🔐 [securityService] Using direct profile query');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin, papel, nome, email')
        .eq('id', session.user.id)
        .single();
      
      if (!profileError && profile) {
        console.log('🔐 [securityService] Profile data:', profile);
        const isAdmin = !!profile.is_admin;
        console.log('🔐 [securityService] Direct profile admin status:', isAdmin);
        return isAdmin;
      } else {
        console.error('🔐 [securityService] Profile query error:', profileError);
      }

      // Fallback: Try RPC function
      console.log('🔐 [securityService] Falling back to RPC function');
      try {
        const { data, error } = await supabase.rpc('is_admin');
        
        if (!error && data !== null) {
          console.log('🔐 [securityService] RPC result:', data);
          return !!data;
        } else {
          console.warn('🔐 [securityService] RPC failed:', error);
        }
      } catch (rpcError) {
        console.warn('🔐 [securityService] RPC exception:', rpcError);
      }

      // If all methods fail, user is not admin
      console.log('🔐 [securityService] All methods failed - user is not admin');
      return false;
      
    } catch (error) {
      console.error('🔐 [securityService] Exception checking admin status:', error);
      return false;
    }
  },

  // Secure admin promotion using the new function
  async promoteUserToAdmin(userId: string, reason?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('secure_admin_promotion', {
        target_user_id: userId,
        action: 'promote',
        reason: reason || 'Admin promotion via security service'
      });

      if (error) {
        console.error('Error promoting user to admin:', error);
        await this.logSecurityEvent('admin_promotion_failed', {
          target_user_id: userId,
          error: error.message,
          reason
        });
        return { success: false, error: error.message };
      }

      // Type assertion for the response
      const response = data as { success?: boolean; message?: string; error?: string };
      
      if (response?.success) {
        toast.success('Usuário promovido a administrador com sucesso');
        return { success: true, message: response.message };
      } else {
        toast.error(response?.error || 'Falha ao promover usuário');
        return { success: false, error: response?.error };
      }
    } catch (error) {
      console.error('Exception promoting user to admin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.logSecurityEvent('admin_promotion_exception', {
        target_user_id: userId,
        error: errorMessage,
        reason
      });
      return { success: false, error: errorMessage };
    }
  },

  // Secure admin demotion
  async demoteUserFromAdmin(userId: string, reason?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('secure_admin_promotion', {
        target_user_id: userId,
        action: 'demote',
        reason: reason || 'Admin demotion via security service'
      });

      if (error) {
        console.error('Error demoting user from admin:', error);
        await this.logSecurityEvent('admin_demotion_failed', {
          target_user_id: userId,
          error: error.message,
          reason
        });
        return { success: false, error: error.message };
      }

      // Type assertion for the response
      const response = data as { success?: boolean; message?: string; error?: string };

      if (response?.success) {
        toast.success('Privilégios de administrador removidos com sucesso');
        return { success: true, message: response.message };
      } else {
        toast.error(response?.error || 'Falha ao remover privilégios');
        return { success: false, error: response?.error };
      }
    } catch (error) {
      console.error('Exception demoting user from admin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.logSecurityEvent('admin_demotion_exception', {
        target_user_id: userId,
        error: errorMessage,
        reason
      });
      return { success: false, error: errorMessage };
    }
  },

  // Validate user session and log suspicious activity
  async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        await this.logSecurityEvent('session_validation_error', { error: error.message });
        return false;
      }

      if (!session) {
        await this.logSecurityEvent('no_active_session');
        return false;
      }

      // Check if session is near expiry (within 5 minutes)
      const expiryTime = new Date(session.expires_at || 0).getTime();
      const currentTime = new Date().getTime();
      const timeUntilExpiry = expiryTime - currentTime;

      if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
        await this.logSecurityEvent('session_near_expiry', {
          expires_at: session.expires_at,
          time_until_expiry: timeUntilExpiry
        });
      }

      return true;
    } catch (error) {
      await this.logSecurityEvent('session_validation_exception', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  },

  // Monitor failed login attempts
  async logFailedLogin(email: string, error: string): Promise<void> {
    await this.logSecurityEvent('failed_login_attempt', {
      email: email.toLowerCase(),
      error,
      timestamp: new Date().toISOString()
    });
  },

  // Monitor successful login
  async logSuccessfulLogin(userId: string): Promise<void> {
    await this.logSecurityEvent('successful_login', {
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }
};
