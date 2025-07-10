
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface SecurityEvent {
  event_type: string;
  details?: any;
  user_id?: string;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

// Enhanced rate limiting with IP tracking and progressive delays
const rateLimitStore = new Map<string, { 
  count: number; 
  firstAttempt: number; 
  lastAttempt: number;
  blocked?: boolean;
  blockUntil?: number;
}>();

export const securityService = {
  // Enhanced rate limiting check with progressive blocking
  checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const existing = rateLimitStore.get(key);
    
    if (!existing) {
      rateLimitStore.set(key, { 
        count: 1, 
        firstAttempt: now, 
        lastAttempt: now 
      });
      return true;
    }
    
    // Check if currently blocked
    if (existing.blocked && existing.blockUntil && now < existing.blockUntil) {
      return false;
    }
    
    // Reset if window has passed
    if (now - existing.firstAttempt > windowMs) {
      rateLimitStore.set(key, { 
        count: 1, 
        firstAttempt: now, 
        lastAttempt: now 
      });
      return true;
    }
    
    // Check if limit exceeded
    if (existing.count >= maxAttempts) {
      // Progressive blocking: block for increasingly longer periods
      const blockDuration = Math.min(existing.count * 60000, 3600000); // Max 1 hour
      existing.blocked = true;
      existing.blockUntil = now + blockDuration;
      
      this.logSecurityEvent('rate_limit_exceeded', {
        key,
        attempts: existing.count,
        block_duration: blockDuration
      });
      
      return false;
    }
    
    // Increment count and update last attempt
    existing.count++;
    existing.lastAttempt = now;
    return true;
  },

  // Enhanced input validation
  validateInput(value: any, type: 'email' | 'cep' | 'phone' | 'text' | 'number'): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value;

    if (value === null || value === undefined) {
      return { isValid: false, errors: ['Valor é obrigatório'] };
    }

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push('Email inválido');
        }
        sanitizedValue = value.toLowerCase().trim();
        break;
        
      case 'cep':
        const cepRegex = /^\d{8}$/;
        const cleanCep = value.replace(/\D/g, '');
        if (!cepRegex.test(cleanCep)) {
          errors.push('CEP deve conter 8 dígitos');
        }
        sanitizedValue = cleanCep;
        break;
        
      case 'phone':
        const phoneRegex = /^[\d\s\-\(\)]+$/;
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          errors.push('Telefone inválido');
        }
        sanitizedValue = cleanPhone;
        break;
        
      case 'text':
        if (typeof value !== 'string') {
          errors.push('Valor deve ser texto');
        } else if (value.length > 1000) {
          errors.push('Texto muito longo (máximo 1000 caracteres)');
        }
        // Basic XSS protection
        sanitizedValue = value.replace(/<script[^>]*>.*?<\/script>/gi, '')
                             .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
                             .replace(/javascript:/gi, '')
                             .trim();
        break;
        
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push('Valor deve ser um número');
        }
        sanitizedValue = num;
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  },

  // Secure CEP lookup function
  async secureCepLookup(cep: string): Promise<any> {
    const rateLimitKey = `cep_lookup_${cep}`;
    
    // Rate limit: max 10 CEP lookups per minute per CEP
    if (!this.checkRateLimit(rateLimitKey, 10, 60000)) {
      throw new Error('Rate limit excedido para consulta de CEP');
    }

    // Validate CEP format
    const validation = this.validateInput(cep, 'cep');
    if (!validation.isValid) {
      await this.logSecurityEvent('invalid_cep_lookup', {
        cep,
        errors: validation.errors
      });
      throw new Error(`CEP inválido: ${validation.errors.join(', ')}`);
    }

    const cleanCep = validation.sanitizedValue;

    try {
      // First check local cache
      const { data: cached } = await supabase
        .from('zip_cache')
        .select('*')
        .eq('cep', cleanCep)
        .single();

      if (cached) {
        await this.logSecurityEvent('cep_cache_hit', { cep: cleanCep });
        return cached;
      }

      // If not cached, fetch from external API
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        await this.logSecurityEvent('cep_not_found', { cep: cleanCep });
        throw new Error('CEP não encontrado');
      }

      // Use secure function to cache the result
      const { data: insertResult, error } = await supabase.rpc('secure_insert_zip_cache', {
        p_cep: cleanCep,
        p_logradouro: data.logradouro,
        p_bairro: data.bairro,
        p_localidade: data.localidade,
        p_uf: data.uf,
        p_ibge: data.ibge
      });

      if (error) {
        console.error('Error caching CEP data:', error);
      }

      await this.logSecurityEvent('cep_external_lookup', { 
        cep: cleanCep,
        cached: !!insertResult 
      });

      return data;
    } catch (error) {
      await this.logSecurityEvent('cep_lookup_error', {
        cep: cleanCep,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
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
