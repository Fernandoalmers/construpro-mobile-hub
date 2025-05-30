
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

interface ReferralInfo {
  codigo: string;
  saldo_pontos: number;
  total_referrals: number;
  pending_referrals: number;
  approved_referrals: number;
  points_earned: number;
  referrals: Array<{
    id: string;
    status: 'pendente' | 'aprovado' | 'rejeitado';
    pontos: number;
    data: string;
    profiles: {
      nome: string;
      email: string;
      created_at: string;
    }
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Get authorization token from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 401, headers: { ...corsHeaders } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase clients
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders } }
      );
    }
    
    // GET: Fetch referral information
    if (req.method === 'GET') {
      // Get the user's profile to get the referral code
      const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select('codigo, saldo_pontos')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Error fetching profile' }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
      
      // Generate a referral code if the user doesn't have one yet
      let referralCode = profile.codigo;
      if (!referralCode) {
        // Generate a 6-character alphanumeric code
        referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Save the code to the user's profile
        const { error: updateError } = await userClient
          .from('profiles')
          .update({ codigo: referralCode })
          .eq('id', user.id);
        
        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Error updating profile with referral code' }),
            { status: 500, headers: { ...corsHeaders } }
          );
        }
      }
      
      // Get the referrals made by this user
      const { data: referrals, error: referralsError } = await userClient
        .from('referrals')
        .select(`
          id, status, pontos, data,
          profiles:referred_id(nome, email, created_at)
        `)
        .eq('referrer_id', user.id);
      
      if (referralsError) {
        return new Response(
          JSON.stringify({ error: 'Error fetching referrals' }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
      
      // Calculate statistics
      const totalReferrals = referrals ? referrals.length : 0;
      const pendingReferrals = referrals ? referrals.filter(r => r.status === 'pendente').length : 0;
      const approvedReferrals = referrals ? referrals.filter(r => r.status === 'aprovado').length : 0;
      const pointsEarned = referrals 
        ? referrals.filter(r => r.status === 'aprovado').reduce((sum, r) => sum + (r.pontos || 0), 0) 
        : 0;
      
      // Build response
      const response: ReferralInfo = {
        codigo: referralCode,
        saldo_pontos: profile.saldo_pontos || 0,
        total_referrals: totalReferrals,
        pending_referrals: pendingReferrals,
        approved_referrals: approvedReferrals,
        points_earned: pointsEarned,
        referrals: referrals || []
      };
      
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // POST: Apply a referral code
    if (req.method === 'POST') {
      const { codigo } = await req.json();
      
      if (!codigo) {
        return new Response(
          JSON.stringify({ error: 'Referral code is required' }),
          { status: 400, headers: { ...corsHeaders } }
        );
      }
      
      // Find the referrer based on the code
      const { data: referrer, error: referrerError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('codigo', codigo)
        .single();
      
      if (referrerError || !referrer) {
        return new Response(
          JSON.stringify({ error: 'Invalid referral code' }),
          { status: 404, headers: { ...corsHeaders } }
        );
      }
      
      // Make sure the user isn't referring themselves
      if (referrer.id === user.id) {
        return new Response(
          JSON.stringify({ error: 'You cannot refer yourself' }),
          { status: 400, headers: { ...corsHeaders } }
        );
      }
      
      // Check if this referral already exists
      const { data: existingReferral, error: existingError } = await adminClient
        .from('referrals')
        .select('id')
        .eq('referrer_id', referrer.id)
        .eq('referred_id', user.id)
        .single();
      
      if (existingReferral) {
        return new Response(
          JSON.stringify({ error: 'This referral already exists' }),
          { status: 409, headers: { ...corsHeaders } }
        );
      }
      
      // Create the referral record
      const { error: createError } = await adminClient
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: user.id,
          status: 'pendente',
          pontos: 50
        });
      
      if (createError) {
        return new Response(
          JSON.stringify({ error: 'Error creating referral record' }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Referral code applied successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // PUT: Activate referral when first purchase is made
    if (req.method === 'PUT') {
      const { action, user_id } = await req.json();
      
      if (action === 'activate_referral_on_first_purchase') {
        // Find pending referral for this user
        const { data: referral, error: referralError } = await adminClient
          .from('referrals')
          .select('id, referrer_id, referred_id, status, pontos')
          .eq('referred_id', user_id)
          .eq('status', 'pendente')
          .single();
        
        if (referralError || !referral) {
          // No pending referral found - this is normal for users without referral codes
          return new Response(
            JSON.stringify({ success: true, message: 'No pending referral to activate' }),
            { status: 200, headers: { ...corsHeaders } }
          );
        }
        
        // Check if this is the user's first order
        const { data: orders, error: ordersError } = await adminClient
          .from('orders')
          .select('id')
          .eq('cliente_id', user_id)
          .limit(1);
        
        if (ordersError) {
          return new Response(
            JSON.stringify({ error: 'Error checking order history' }),
            { status: 500, headers: { ...corsHeaders } }
          );
        }
        
        // If this is indeed the first order, activate the referral
        if (orders && orders.length === 1) {
          // Update referral status to approved
          const { error: updateError } = await adminClient
            .from('referrals')
            .update({
              status: 'aprovado',
              data_aprovacao: new Date().toISOString()
            })
            .eq('id', referral.id);
          
          if (updateError) {
            return new Response(
              JSON.stringify({ error: 'Error updating referral status' }),
              { status: 500, headers: { ...corsHeaders } }
            );
          }
          
          // Award points to referrer
          const { error: referrerUpdateError } = await adminClient.rpc(
            'update_user_points',
            { 
              user_id: referral.referrer_id, 
              points_to_add: referral.pontos
            }
          );
          
          if (referrerUpdateError) {
            return new Response(
              JSON.stringify({ error: 'Error awarding points to referrer' }),
              { status: 500, headers: { ...corsHeaders } }
            );
          }
          
          // Log transaction for referrer
          const { error: referrerTxError } = await adminClient
            .from('points_transactions')
            .insert({
              user_id: referral.referrer_id,
              pontos: referral.pontos,
              tipo: 'indicacao',
              referencia_id: referral.id,
              descricao: 'Pontos por indicação aprovada - primeira compra do indicado'
            });
          
          if (referrerTxError) {
            return new Response(
              JSON.stringify({ error: 'Error logging referrer transaction' }),
              { status: 500, headers: { ...corsHeaders } }
            );
          }
          
          // Award points to referred user
          const { error: referredUpdateError } = await adminClient.rpc(
            'update_user_points',
            { 
              user_id: referral.referred_id, 
              points_to_add: referral.pontos
            }
          );
          
          if (referredUpdateError) {
            return new Response(
              JSON.stringify({ error: 'Error awarding points to referred user' }),
              { status: 500, headers: { ...corsHeaders } }
            );
          }
          
          // Log transaction for referred user
          const { error: referredTxError } = await adminClient
            .from('points_transactions')
            .insert({
              user_id: referral.referred_id,
              pontos: referral.pontos,
              tipo: 'indicacao',
              referencia_id: referral.id,
              descricao: 'Pontos por primeira compra com código de indicação'
            });
          
          if (referredTxError) {
            return new Response(
              JSON.stringify({ error: 'Error logging referred user transaction' }),
              { status: 500, headers: { ...corsHeaders } }
            );
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Referral activated and points awarded'
            }),
            { status: 200, headers: { ...corsHeaders } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Not first order, referral remains pending' }),
          { status: 200, headers: { ...corsHeaders } }
        );
      }
      
      // Legacy admin update functionality
      const { id, status, pontos } = await req.json();
      
      if (!id || !status) {
        return new Response(
          JSON.stringify({ error: 'Referral ID and status are required' }),
          { status: 400, headers: { ...corsHeaders } }
        );
      }
      
      // Check if user is admin
      const { data: profile, error: profileError } = await userClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Error checking user permissions' }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
      
      // Only admins can manually update referrals
      if (!profile.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Only admins can update referrals' }),
          { status: 403, headers: { ...corsHeaders } }
        );
      }
      
      // Get the referral
      const { data: referral, error: referralError } = await adminClient
        .from('referrals')
        .select('referrer_id, referred_id, status')
        .eq('id', id)
        .single();
      
      if (referralError || !referral) {
        return new Response(
          JSON.stringify({ error: 'Referral not found' }),
          { status: 404, headers: { ...corsHeaders } }
        );
      }
      
      // If transitioning from pending to approved, award points
      if (referral.status === 'pendente' && status === 'aprovado') {
        // Award points to referrer
        const { error: referrerUpdateError } = await adminClient.rpc(
          'update_user_points',
          { 
            user_id: referral.referrer_id, 
            points_to_add: pontos || 50
          }
        );
        
        if (referrerUpdateError) {
          return new Response(
            JSON.stringify({ error: 'Error awarding points to referrer' }),
            { status: 500, headers: { ...corsHeaders } }
          );
        }
        
        // Log transaction for referrer
        const { error: referrerTxError } = await adminClient
          .from('points_transactions')
          .insert({
            user_id: referral.referrer_id,
            pontos: pontos || 50,
            tipo: 'indicacao',
            referencia_id: id,
            descricao: 'Pontos por indicação aprovada'
          });
        
        if (referrerTxError) {
          return new Response(
            JSON.stringify({ error: 'Error logging referrer transaction' }),
            { status: 500, headers: { ...corsHeaders } }
          );
        }
        
        // Award points to referred user
        const { error: referredUpdateError } = await adminClient.rpc(
          'update_user_points',
          { 
            user_id: referral.referred_id, 
            points_to_add: pontos || 50
          }
        );
        
        if (referredUpdateError) {
          return new Response(
            JSON.stringify({ error: 'Error awarding points to referred user' }),
            { status: 500, headers: { ...corsHeaders } }
          );
        }
        
        // Log transaction for referred user
        const { error: referredTxError } = await adminClient
          .from('points_transactions')
          .insert({
            user_id: referral.referred_id,
            pontos: pontos || 50,
            tipo: 'indicacao',
            referencia_id: id,
            descricao: 'Pontos por se cadastrar com código de indicação'
          });
        
        if (referredTxError) {
          return new Response(
            JSON.stringify({ error: 'Error logging referred user transaction' }),
            { status: 500, headers: { ...corsHeaders } }
          );
        }
      }
      
      // Update the referral status
      const { error: updateError } = await adminClient
        .from('referrals')
        .update({
          status,
          pontos: pontos || 50
        })
        .eq('id', id);
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Error updating referral' }),
          { status: 500, headers: { ...corsHeaders } }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Referral updated to ${status}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If the method is not supported
    return new Response(
      JSON.stringify({ error: 'Method not supported' }),
      { status: 405, headers: { ...corsHeaders } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders } }
    );
  }
})
