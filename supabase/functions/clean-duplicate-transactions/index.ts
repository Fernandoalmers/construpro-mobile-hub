
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    // Verify admin status before allowing this action
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || !profile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      )
    }
    
    // Get request data if provided
    const requestData = req.method === 'POST' ? await req.json() : {}
    const dryRun = requestData.dryRun === true
    const forceCleanup = requestData.forceCleanup === true
    
    // First check if we need to drop any redundant triggers
    // This runs only if forceCleanup is true to prevent repeat executions
    if (forceCleanup) {
      const { data: dropTriggersResult, error: dropTriggersError } = await supabaseClient.rpc(
        'execute_custom_sql',
        {
          sql_statement: `
            -- Drop redundant triggers for register_point_adjustment_transaction
            DROP TRIGGER IF EXISTS register_points_transaction_trigger ON public.pontos_ajustados;
            DROP TRIGGER IF EXISTS register_transaction_after_adjustment ON public.pontos_ajustados;
            DROP TRIGGER IF EXISTS trigger_register_transaction ON public.pontos_ajustados;

            -- Drop redundant triggers for update_points_on_adjustment
            DROP TRIGGER IF EXISTS update_points_after_adjustment ON public.pontos_ajustados;
            DROP TRIGGER IF EXISTS update_points_on_adjustment_trigger ON public.pontos_ajustados;
            DROP TRIGGER IF EXISTS update_points_trigger ON public.pontos_ajustados;
          `
        }
      )
      
      if (dropTriggersError) {
        return new Response(
          JSON.stringify({ error: 'Error dropping redundant triggers: ' + dropTriggersError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      // Log success on triggers dropped
      console.log('Successfully dropped redundant triggers', dropTriggersResult)
    }
    
    // Get list of current triggers for reporting
    const { data: currentTriggersData, error: currentTriggersError } = await supabaseClient.rpc(
      'execute_custom_sql',
      {
        sql_statement: `
          SELECT trigger_name, action_statement
          FROM information_schema.triggers
          WHERE event_object_table = 'pontos_ajustados'
          ORDER BY trigger_name;
        `
      }
    )
    
    if (currentTriggersError) {
      console.error('Error getting current triggers:', currentTriggersError)
    }
    
    // Identify duplicate transactions
    const { data: duplicatesData, error: duplicatesError } = await supabaseClient.rpc(
      'execute_custom_sql',
      {
        sql_statement: `
          WITH grouped_transactions AS (
            SELECT 
              user_id, 
              tipo,
              pontos, 
              substring(descricao from 'Ajuste de pontos: (.+)') as motivo_base,
              referencia_id,
              MIN(data) as first_date,
              COUNT(*) as count
            FROM points_transactions
            WHERE descricao LIKE 'Ajuste de pontos:%'
            GROUP BY user_id, tipo, pontos, substring(descricao from 'Ajuste de pontos: (.+)'), referencia_id
            HAVING COUNT(*) > 1
          )
          SELECT 
            *,
            (SELECT json_agg(id) FROM points_transactions pt 
              WHERE pt.user_id = grouped_transactions.user_id
              AND pt.tipo = grouped_transactions.tipo
              AND pt.pontos = grouped_transactions.pontos
              AND pt.referencia_id = grouped_transactions.referencia_id
              AND substring(pt.descricao from 'Ajuste de pontos: (.+)') = grouped_transactions.motivo_base
              AND pt.data > grouped_transactions.first_date
            ) as duplicate_ids
          FROM grouped_transactions
          ORDER BY count DESC;
        `
      }
    )
    
    if (duplicatesError) {
      return new Response(
        JSON.stringify({ error: 'Error finding duplicates: ' + duplicatesError.message }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    const duplicates = duplicatesData?.status === 'success' ? 
      duplicatesData.duplicates : []
    
    // If this is a dry run, just return the duplicates
    if (dryRun) {
      return new Response(
        JSON.stringify({ 
          status: 'dryRun', 
          message: 'Dry run - no changes made',
          duplicates,
          currentTriggers: currentTriggersData?.status === 'success' ? 
            currentTriggersData.duplicates : []
        }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // Actually delete the duplicate transactions if not a dry run
    let deletedCount = 0
    let errors = []
    
    // For each group of duplicates, delete all but the first one
    if (duplicates && Array.isArray(duplicates)) {
      for (const group of duplicates) {
        if (group.duplicate_ids && group.duplicate_ids.length > 0) {
          const { error: deleteError } = await supabaseClient
            .from('points_transactions')
            .delete()
            .in('id', group.duplicate_ids)
          
          if (deleteError) {
            errors.push(`Error deleting duplicates for group ${group.referencia_id}: ${deleteError.message}`)
          } else {
            deletedCount += group.duplicate_ids.length
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        status: 'success',
        message: `Deleted ${deletedCount} duplicate transactions`,
        triggersRemoved: forceCleanup ? 6 : 0,
        currentTriggers: currentTriggersData?.status === 'success' ? 
          currentTriggersData.duplicates : [],
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})
