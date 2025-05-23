import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

interface CleanDuplicatesOptions {
  dryRun?: boolean;
  forceCleanup?: boolean;
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
    
    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    const isAdmin = profile?.is_admin === true
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only administrators can clean duplicate transactions' }),
        { status: 403, headers: corsHeaders }
      )
    }
    
    // Get options from request body
    let options: CleanDuplicatesOptions = { dryRun: true }
    try {
      if (req.method === 'POST') {
        const body = await req.json()
        options = {
          dryRun: body.dryRun !== false, // Default to dry run if not explicitly set to false
          forceCleanup: !!body.forceCleanup // Optional force cleanup parameter
        }
      }
    } catch (err) {
      console.error('Error parsing request body:', err)
      // Continue with default options
    }

    // Get duplicate transactions using our SQL function
    const { data: duplicateGroups, error: duplicatesError } = await supabaseClient
      .from('get_duplicate_transactions')
      .select('*')
    
    if (duplicatesError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching duplicate transactions', details: duplicatesError.message }),
        { status: 500, headers: corsHeaders }
      )
    }

    // If no duplicates found, return empty result
    if (!duplicateGroups || duplicateGroups.length === 0) {
      return new Response(
        JSON.stringify({ 
          dryRun: options.dryRun,
          duplicates: [],
          duplicateGroups: [],
          message: 'No duplicate transactions found' 
        }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // Calculate total duplicate transactions
    const totalDuplicates = duplicateGroups.reduce((total, group) => 
      total + Math.max(0, group.transaction_count - 1), 0)
    
    // Log what we found
    console.log(`Found ${duplicateGroups.length} duplicate groups with ${totalDuplicates} total duplicate transactions`)
    
    // If this is a dry run, just return the duplicates without deleting
    if (options.dryRun) {
      return new Response(
        JSON.stringify({ 
          dryRun: true,
          duplicateGroups,
          duplicates: duplicateGroups,
          message: `Found ${duplicateGroups.length} duplicate groups with ${totalDuplicates} total duplicate transactions` 
        }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // If not a dry run, delete the duplicates
    let deletedCount = 0
    let triggersRemoved = 0
    const affectedUserIds = new Set<string>()
    
    for (const group of duplicateGroups) {
      // Keep the first transaction (index 0) and delete the rest
      const transactionsToDelete = group.transaction_ids.slice(1)
      
      if (transactionsToDelete.length > 0) {
        // Delete the duplicates
        const { error } = await supabaseClient
          .from('points_transactions')
          .delete()
          .in('id', transactionsToDelete)
        
        if (error) {
          console.error(`Error deleting duplicates for group ${group.group_id}:`, error)
          continue
        }
        
        deletedCount += transactionsToDelete.length
        affectedUserIds.add(group.user_id)
      }
    }
    
    // After cleanup, reconcile points for affected users
    let reconciliationCount = 0
    const reconciliationResults = []
    
    for (const userId of affectedUserIds) {
      const { data: reconcileData, error: reconcileError } = await supabaseClient.rpc(
        'reconcile_user_points',
        { target_user_id: userId }
      )
      
      if (reconcileError) {
        console.error(`Error reconciling points for user ${userId}:`, reconcileError)
        continue
      }
      
      if (reconcileData && reconcileData.length > 0) {
        const result = reconcileData[0]
        if (result.difference !== 0) {
          reconciliationCount++
          reconciliationResults.push(result)
        }
      }
    }
    
    // Return results
    return new Response(
      JSON.stringify({
        dryRun: false,
        success: true,
        deletedCount,
        triggersRemoved,
        reconciliationCount,
        affectedUsers: Array.from(affectedUserIds),
        reconciliationResults,
        message: `Successfully deleted ${deletedCount} duplicate transactions and reconciled ${reconciliationCount} user balances`
      }),
      { status: 200, headers: corsHeaders }
    )
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
