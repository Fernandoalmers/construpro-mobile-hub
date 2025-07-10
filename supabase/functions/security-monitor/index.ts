import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  user_id?: string;
  ip_address?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { action, ...data } = await req.json();

      switch (action) {
        case 'check_suspicious_activity':
          return await checkSuspiciousActivity(supabaseClient, data);
        
        case 'audit_security_events':
          return await auditSecurityEvents(supabaseClient, data);
        
        case 'cleanup_zip_cache':
          return await cleanupSuspiciousZipCache(supabaseClient);
        
        case 'validate_system_integrity':
          return await validateSystemIntegrity(supabaseClient);
        
        default:
          return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Security monitor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkSuspiciousActivity(supabase: any, data: any) {
  const { user_id, ip_address, time_window = 3600000 } = data; // Default 1 hour
  const alerts: SecurityAlert[] = [];
  const now = new Date();
  const timeThreshold = new Date(now.getTime() - time_window);

  try {
    // Check for excessive failed login attempts
    const { data: failedLogins } = await supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'failed_login_attempt')
      .gte('created_at', timeThreshold.toISOString())
      .order('created_at', { ascending: false });

    if (failedLogins && failedLogins.length > 10) {
      alerts.push({
        type: 'excessive_failed_logins',
        severity: 'high',
        details: {
          count: failedLogins.length,
          recent_attempts: failedLogins.slice(0, 5)
        }
      });
    }

    // Check for admin privilege escalation attempts
    const { data: adminAttempts } = await supabase
      .from('security_events')
      .select('*')
      .in('event_type', ['admin_promotion_failed', 'unauthorized_admin_action'])
      .gte('created_at', timeThreshold.toISOString());

    if (adminAttempts && adminAttempts.length > 0) {
      alerts.push({
        type: 'admin_escalation_attempts',
        severity: 'critical',
        details: {
          count: adminAttempts.length,
          attempts: adminAttempts
        }
      });
    }

    // Check for rate limit violations
    const { data: rateLimitViolations } = await supabase
      .from('security_events')
      .select('*')
      .eq('event_type', 'rate_limit_exceeded')
      .gte('created_at', timeThreshold.toISOString());

    if (rateLimitViolations && rateLimitViolations.length > 5) {
      alerts.push({
        type: 'excessive_rate_limit_violations',
        severity: 'medium',
        details: {
          count: rateLimitViolations.length,
          violations: rateLimitViolations
        }
      });
    }

    // Check for suspicious ZIP cache activity
    const { data: zipCacheEvents } = await supabase
      .from('security_events')
      .select('*')
      .in('event_type', ['zip_cache_insert_failed', 'invalid_cep_lookup'])
      .gte('created_at', timeThreshold.toISOString());

    if (zipCacheEvents && zipCacheEvents.length > 20) {
      alerts.push({
        type: 'suspicious_zip_cache_activity',
        severity: 'medium',
        details: {
          count: zipCacheEvents.length,
          recent_events: zipCacheEvents.slice(0, 10)
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        checked_at: now.toISOString(),
        time_window_hours: time_window / 3600000
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking suspicious activity:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check suspicious activity' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function auditSecurityEvents(supabase: any, data: any) {
  const { days = 7, event_types = [] } = data;
  const timeThreshold = new Date();
  timeThreshold.setDate(timeThreshold.getDate() - days);

  try {
    let query = supabase
      .from('security_events')
      .select('*')
      .gte('created_at', timeThreshold.toISOString())
      .order('created_at', { ascending: false });

    if (event_types.length > 0) {
      query = query.in('event_type', event_types);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    // Aggregate statistics
    const stats = events.reduce((acc: any, event: any) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    return new Response(
      JSON.stringify({
        success: true,
        total_events: events.length,
        event_statistics: stats,
        audit_period_days: days,
        events: events.slice(0, 100) // Limit to first 100 for response size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error auditing security events:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to audit security events' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function cleanupSuspiciousZipCache(supabase: any) {
  try {
    // Find potentially malicious ZIP cache entries
    const { data: suspiciousEntries } = await supabase
      .from('zip_cache')
      .select('*')
      .or('uf.is.null,localidade.is.null,cep.not.like.________'); // 8 digits check

    let cleanedCount = 0;

    if (suspiciousEntries && suspiciousEntries.length > 0) {
      // Log the cleanup operation
      await supabase
        .from('security_events')
        .insert({
          event_type: 'zip_cache_cleanup',
          details: {
            suspicious_entries_found: suspiciousEntries.length,
            entries: suspiciousEntries.slice(0, 10) // Sample
          }
        });

      // Delete suspicious entries (this would be done by service role)
      for (const entry of suspiciousEntries) {
        if (!entry.uf || !entry.localidade || !/^\d{8}$/.test(entry.cep)) {
          await supabase
            .from('zip_cache')
            .delete()
            .eq('cep', entry.cep);
          cleanedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        suspicious_entries_found: suspiciousEntries?.length || 0,
        entries_cleaned: cleanedCount,
        cleaned_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error cleaning ZIP cache:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to clean ZIP cache' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function validateSystemIntegrity(supabase: any) {
  try {
    const issues: any[] = [];

    // Check for users without profiles
    const { data: usersWithoutProfiles } = await supabase
      .rpc('execute_custom_sql', {
        sql_statement: `
          SELECT COUNT(*) as count 
          FROM auth.users u 
          LEFT JOIN public.profiles p ON u.id = p.id 
          WHERE p.id IS NULL
        `
      });

    if (usersWithoutProfiles?.count > 0) {
      issues.push({
        type: 'users_without_profiles',
        severity: 'medium',
        count: usersWithoutProfiles.count
      });
    }

    // Check for orphaned records
    const { data: orphanedCarts } = await supabase
      .from('carts')
      .select('id')
      .not('user_id', 'in', '(SELECT id FROM profiles)');

    if (orphanedCarts && orphanedCarts.length > 0) {
      issues.push({
        type: 'orphaned_carts',
        severity: 'low',
        count: orphanedCarts.length
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        integrity_check_completed: true,
        issues_found: issues.length,
        issues,
        checked_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating system integrity:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to validate system integrity' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}