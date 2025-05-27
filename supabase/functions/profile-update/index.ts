
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'vendedor';

interface Profile {
  id?: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  papel?: UserRole;
  tipo_perfil?: UserRole;
  saldo_pontos?: number;
  status?: string;
  avatar?: string;
  codigo?: string;
  created_at?: string;
  updated_at?: string;
  endereco_principal?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  // NOTA: is_admin foi removido para segurança
}

serve(async (req) => {
  try {
    // Set CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json'
    }
    
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }
    
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error("🚫 [profile-update] Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    // Client with Service Role token (bypassing RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // Client with JWT token (from user) to verify identity
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
    
    console.log("🔐 [profile-update] Verifying user token");
    
    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error("❌ [profile-update] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized' }),
        { status: 401, headers }
      )
    }
    
    console.log(`✅ [profile-update] User authenticated: ${user.id}`);
    
    // Handle GET request - fetch profile
    if (req.method === 'GET') {
      const { data: profile, error: getError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (getError) {
        console.error("❌ [profile-update] Error fetching profile:", getError);
        return new Response(
          JSON.stringify({ error: getError.message }),
          { status: 500, headers }
        )
      }
      
      console.log("✅ [profile-update] Profile fetched successfully");
      
      // Return profile
      return new Response(
        JSON.stringify({
          success: true,
          data: profile
        }),
        { status: 200, headers }
      )
    }
    
    // Handle POST/PUT requests - update profile
    if (req.method === 'POST' || req.method === 'PUT') {
      // Get update data from request body
      let requestData: Profile;
      try {
        requestData = await req.json();
        console.log("📝 [profile-update] Received update request for fields:", Object.keys(requestData));
      } catch (parseError) {
        console.error("❌ [profile-update] Error parsing request body:", parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers }
        );
      }
      
      // SEGURANÇA CRÍTICA: Verificar tentativas de alterar is_admin
      if ('is_admin' in requestData) {
        console.error("🚫 [profile-update] SECURITY VIOLATION: Attempt to modify admin status");
        
        // Log da violação de segurança
        await adminClient.rpc('log_admin_action', {
          action: 'security_violation',
          entity_type: 'profile_update',
          entity_id: user.id,
          details: {
            violation: 'attempted_admin_elevation',
            user_id: user.id,
            timestamp: new Date().toISOString(),
            request_data: requestData
          }
        });
        
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Cannot modify admin privileges' }),
          { status: 403, headers }
        );
      }
      
      // Create a clean update object (preventing unauthorized updates)
      const updateData: Record<string, any> = {}
      
      // Only allow certain fields to be updated (EXCLUINDO is_admin)
      const allowedFields = [
        'nome', 'cpf', 'telefone', 'papel', 'tipo_perfil', 'avatar', 'status', 'codigo'
      ]
      
      allowedFields.forEach(field => {
        if (field in requestData) {
          updateData[field] = requestData[field]
        }
      })
      
      // Special handling for avatar field
      if ('avatar' in requestData) {
        updateData.avatar = requestData.avatar;
        console.log("📷 [profile-update] Updating avatar");
      }
      
      // Handle nested endereco_principal
      if (requestData.endereco_principal) {
        updateData.endereco_principal = requestData.endereco_principal
      }
      
      // Ensure tipo_perfil and papel are in sync
      if (requestData.papel && !requestData.tipo_perfil) {
        updateData.tipo_perfil = requestData.papel
      }
      
      if (requestData.tipo_perfil && !requestData.papel) {
        updateData.papel = requestData.tipo_perfil
      }
      
      // If no valid data to update
      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          { status: 400, headers }
        )
      }
      
      console.log(`🔧 [profile-update] Updating profile with ${Object.keys(updateData).length} fields`);
      
      // Update profile using admin client to bypass RLS
      const { data: profile, error: updateError } = await adminClient
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
        
      if (updateError) {
        console.error("❌ [profile-update] Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers }
        )
      }
      
      console.log("✅ [profile-update] Profile updated successfully");
      
      // Return updated profile
      return new Response(
        JSON.stringify({
          success: true,
          data: profile
        }),
        { status: 200, headers }
      )
    }
    
    // If method is not GET, POST or PUT
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
    
  } catch (error) {
    console.error("❌ [profile-update] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        } 
      }
    )
  }
})
