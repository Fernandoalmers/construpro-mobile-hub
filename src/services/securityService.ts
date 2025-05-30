
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SecurityEventDetails {
  [key: string]: any;
}

export interface AdminPromotionResult {
  success: boolean;
  message?: string;
  error?: string;
}

class SecurityService {
  // Log security events
  async logSecurityEvent(
    eventType: string, 
    details?: SecurityEventDetails, 
    userId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        event_type: eventType,
        details: details || {},
        user_id_param: userId || null
      });
      
      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Exception logging security event:', error);
    }
  }

  // Secure admin promotion using the new database function
  async promoteUserToAdmin(userId: string, reason?: string): Promise<AdminPromotionResult> {
    try {
      const { data, error } = await supabase.rpc('secure_admin_promotion', {
        target_user_id: userId,
        action: 'promote',
        reason: reason || 'Promoted via admin interface'
      });

      if (error) {
        console.error('Error promoting user:', error);
        await this.logSecurityEvent('admin_promotion_failed', {
          target_user_id: userId,
          error: error.message
        });
        return { success: false, error: error.message };
      }

      const result = data as AdminPromotionResult;
      
      if (result.success) {
        toast.success('Usuário promovido a administrador com sucesso');
        await this.logSecurityEvent('admin_promotion_success', {
          target_user_id: userId,
          reason
        });
      } else {
        toast.error(result.error || 'Falha ao promover usuário');
        await this.logSecurityEvent('admin_promotion_unauthorized', {
          target_user_id: userId,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      console.error('Exception promoting user:', error);
      await this.logSecurityEvent('admin_promotion_exception', {
        target_user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: 'Erro interno ao promover usuário' };
    }
  }

  // Secure admin demotion using the new database function
  async demoteUserFromAdmin(userId: string, reason?: string): Promise<AdminPromotionResult> {
    try {
      const { data, error } = await supabase.rpc('secure_admin_promotion', {
        target_user_id: userId,
        action: 'demote',
        reason: reason || 'Demoted via admin interface'
      });

      if (error) {
        console.error('Error demoting user:', error);
        await this.logSecurityEvent('admin_demotion_failed', {
          target_user_id: userId,
          error: error.message
        });
        return { success: false, error: error.message };
      }

      const result = data as AdminPromotionResult;
      
      if (result.success) {
        toast.success('Privilégios de administrador removidos com sucesso');
        await this.logSecurityEvent('admin_demotion_success', {
          target_user_id: userId,
          reason
        });
      } else {
        toast.error(result.error || 'Falha ao remover privilégios');
        await this.logSecurityEvent('admin_demotion_unauthorized', {
          target_user_id: userId,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      console.error('Exception demoting user:', error);
      await this.logSecurityEvent('admin_demotion_exception', {
        target_user_id: userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: 'Erro interno ao remover privilégios' };
    }
  }

  // Input validation utilities
  validateCartQuantity(quantity: number): boolean {
    return Number.isInteger(quantity) && quantity > 0 && quantity <= 1000;
  }

  validateCouponCode(code: string): boolean {
    // Basic validation: alphanumeric, 3-50 chars
    const regex = /^[A-Za-z0-9\-_]{3,50}$/;
    return regex.test(code.trim());
  }

  sanitizeSearchQuery(query: string): string {
    // Remove potentially dangerous characters
    return query
      .trim()
      .replace(/[<>'"&]/g, '')
      .substring(0, 100); // Limit length
  }

  // Rate limiting check (simple client-side implementation)
  private rateLimitStore = new Map<string, number[]>();

  checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.rateLimitStore.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.rateLimitStore.set(key, validAttempts);
    
    return true;
  }
}

export const securityService = new SecurityService();
