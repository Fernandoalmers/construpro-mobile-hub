
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
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
    
    // Admin client for operations that might require elevated privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
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
    
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const referralId = path[path.length - 1] !== 'referral-processing' ? path[path.length - 1] : null
    
    // GET /referral-processing - Get referral information
    if (req.method === 'GET' && !referralId) {
      // Get user's referral code
      const { data: referrer, error: referrerError } = await supabaseClient
        .from('profiles')
        .select('codigo, saldo_pontos')
        .eq('id', user.id)
        .single()
      
      if (referrerError) {
        return new Response(
          JSON.stringify({ error: referrerError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      // If user doesn't have a code yet, generate one
      if (!referrer.codigo) {
        const code = generateReferralCode(8)
        
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ codigo: code })
          .eq('id', user.id)
        
        if (updateError) {
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        referrer.codigo = code
      }
      
      // Get referrals sent by user
      const { data: sentReferrals, error: sentError } = await supabaseClient
        .from('referrals')
        .select(`
          id, 
          status, 
          pontos, 
          data, 
          profiles!referred_id (
            nome, 
            email, 
            created_at
          )
        `)
        .eq('referrer_id', user.id)
      
      if (sentError) {
        return new Response(
          JSON.stringify({ error: sentError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      return new Response(
        JSON.stringify({
          codigo: referrer.codigo,
          saldo_pontos: referrer.saldo_pontos,
          total_referrals: sentReferrals.length,
          pending_referrals: sentReferrals.filter(ref => ref.status === 'pendente').length,
          approved_referrals: sentReferrals.filter(ref => ref.status === 'aprovado').length,
          points_earned: sentReferrals.reduce((sum, ref) => sum + (ref.pontos || 0), 0),
          referrals: sentReferrals
        }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // POST /referral-processing - Use a referral code during signup
    if (req.method === 'POST') {
      const { codigo } = await req.json()
      
      if (!codigo) {
        return new Response(
          JSON.stringify({ error: 'Missing referral code' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Find the referrer
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('profiles')
        .select('id, codigo')
        .eq('codigo', codigo)
        .single()
      
      if (referrerError || !referrer) {
        return new Response(
          JSON.stringify({ error: 'Invalid referral code' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Make sure the user isn't referring themselves
      if (referrer.id === user.id) {
        return new Response(
          JSON.stringify({ error: 'You cannot use your own referral code' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Check if the user has already been referred
      const { data: existingReferral, error: existingError } = await supabaseAdmin
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
      
      if (existingReferral?.length > 0) {
        return new Response(
          JSON.stringify({ error: 'You have already been referred' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Create the referral record
      const { error: insertError } = await supabaseAdmin
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: user.id,
          status: 'pendente',
          pontos: 0
        })
      
      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Referral code applied successfully' }),
        { status: 201, headers: corsHeaders }
      )
    }
    
    // PUT /referral-processing/:id - Approve a referral (admin only)
    if (req.method === 'PUT' && referralId) {
      // Check if user is admin
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profile.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
          { status: 403, headers: corsHeaders }
        )
      }
      
      const { status, pontos = 300 } = await req.json()
      
      if (!status || !['aprovado', 'rejeitado'].includes(status)) {
        return new Response(
          JSON.stringify({ error: 'Invalid status. Must be "aprovado" or "rejeitado".' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      // Get the referral
      const { data: referral, error: referralError } = await supabaseAdmin
        .from('referrals')
        .select('referrer_id, referred_id, status')
        .eq('id', referralId)
        .single()
      
      if (referralError || !referral) {
        return new Response(
          JSON.stringify({ error: 'Referral not found' }),
          { status: 404, headers: corsHeaders }
        )
      }
      
      // Make sure it's not already processed
      if (referral.status !== 'pendente') {
        return new Response(
          JSON.stringify({ error: 'Referral has already been processed' }),
          { status: 400, headers: corsHeaders }
        )
      }
      
      if (status === 'aprovado') {
        // Add points to referrer
        const { error: pointsError } = await supabaseAdmin
          .from('points_transactions')
          .insert({
            user_id: referral.referrer_id,
            pontos: pontos,
            tipo: 'indicacao',
            referencia_id: referralId,
            descricao: 'Bônus por indicação aprovada'
          })
        
        if (pointsError) {
          return new Response(
            JSON.stringify({ error: pointsError.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        // Update referrer's balance
        const { error: referrerError } = await supabaseAdmin
          .from('profiles')
          .update({
            saldo_pontos: supabaseAdmin.rpc('increment_points', { user_id: referral.referrer_id, amount: pontos })
          })
          .eq('id', referral.referrer_id)
        
        if (referrerError) {
          return new Response(
            JSON.stringify({ error: referrerError.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        // Add points to referred user
        const { error: referredPointsError } = await supabaseAdmin
          .from('points_transactions')
          .insert({
            user_id: referral.referred_id,
            pontos: pontos,
            tipo: 'indicacao',
            referencia_id: referralId,
            descricao: 'Bônus por cadastro com código de indicação'
          })
        
        if (referredPointsError) {
          return new Response(
            JSON.stringify({ error: referredPointsError.message }),
            { status: 500, headers: corsHeaders }
          )
        }
        
        // Update referred user's balance
        const { error: referredError } = await supabaseAdmin
          .from('profiles')
          .update({
            saldo_pontos: supabaseAdmin.rpc('increment_points', { user_id: referral.referred_id, amount: pontos })
          })
          .eq('id', referral.referred_id)
        
        if (referredError) {
          return new Response(
            JSON.stringify({ error: referredError.message }),
            { status: 500, headers: corsHeaders }
          )
        }
      }
      
      // Update the referral status
      const { error: updateError } = await supabaseAdmin
        .from('referrals')
        .update({
          status,
          pontos: status === 'aprovado' ? pontos : 0
        })
        .eq('id', referralId)
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // If the request doesn't match any of the above conditions
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})

// Helper function to generate a random referral code
function generateReferralCode(length: number): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
