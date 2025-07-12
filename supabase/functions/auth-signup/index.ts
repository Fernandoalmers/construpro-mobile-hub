
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'vendedor';

interface SignupData {
  email: string;
  password: string;
  nome: string;
  cpf?: string;
  cnpj?: string;
  telefone?: string;
  tipo_perfil: UserRole;
  especialidade_profissional?: string;
  nome_loja?: string;
}

/**
 * Generate a random referral code
 * @param length Length of the code to generate
 * @returns A random alphanumeric code
 */
function generateReferralCode(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like I, O, 0, 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Check if a referral code already exists
 */
async function isCodeUnique(supabase: any, code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('codigo', code)
    .limit(1);
  
  if (error) {
    console.error('Error checking code uniqueness:', error);
    return false;
  }
  
  return !data || data.length === 0;
}

/**
 * Generate a unique referral code
 */
async function generateUniqueReferralCode(supabase: any): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateReferralCode(6);
    const isUnique = await isCodeUnique(supabase, code);
    
    if (isUnique) {
      console.log(`Generated unique referral code: ${code} (attempt ${attempts + 1})`);
      return code;
    }
    
    attempts++;
    console.log(`Code ${code} already exists, trying again (attempt ${attempts})`);
  }
  
  // Fallback: generate longer code if all attempts failed
  const fallbackCode = generateReferralCode(8);
  console.warn(`Using fallback longer code after ${maxAttempts} attempts: ${fallbackCode}`);
  return fallbackCode;
}

serve(async (req) => {
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
  
  // Check if method is POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    )
  }
  
  try {
    console.log("🚀 Auth signup function called - v4.0 with enhanced professional support");
    
    // Parse request body
    let userData: SignupData;
    try {
      userData = await req.json();
      console.log("📥 Received signup data:", { 
        email: userData.email, 
        nome: userData.nome,
        tipo_perfil: userData.tipo_perfil,
        especialidade_profissional: userData.especialidade_profissional,
        nome_loja: userData.nome_loja,
        has_cpf: !!userData.cpf,
        has_cnpj: !!userData.cnpj
      });
    } catch (parseError) {
      console.error("❌ Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Dados inválidos no corpo da requisição' 
        }),
        { status: 400, headers }
      );
    }
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.nome) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Email, senha e nome são obrigatórios' 
        }),
        { status: 400, headers }
      )
    }
    
    // Validate document based on profile type
    if (userData.tipo_perfil === 'lojista') {
      if (!userData.cnpj) {
        console.error("❌ Missing CNPJ for lojista");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CNPJ é obrigatório para vendedores' 
          }),
          { status: 400, headers }
        )
      }
    } else {
      if (!userData.cpf) {
        console.error("❌ Missing CPF for non-lojista");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CPF é obrigatório' 
          }),
          { status: 400, headers }
        )
      }
    }

    // Validate specialty for professionals
    if (userData.tipo_perfil === 'profissional' && !userData.especialidade_profissional) {
      console.error("❌ Missing especialidade for profissional");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Especialidade é obrigatória para profissionais' 
        }),
        { status: 400, headers }
      )
    }
    
    // Set default role if not provided
    if (!userData.tipo_perfil) {
      userData.tipo_perfil = 'consumidor';
    }
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro de configuração do servidor' 
        }),
        { status: 500, headers }
      );
    }

    console.log("🔧 Initializing Supabase client for auth-signup");
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate unique referral code for this user
    console.log("🎲 Generating unique referral code...");
    const referralCode = await generateUniqueReferralCode(supabaseAdmin);
    console.log("✅ Generated referral code:", referralCode);

    // Prepare user metadata with all required fields including referral code
    const userMetadata = {
      nome: userData.nome,
      telefone: userData.telefone || null,
      tipo_perfil: userData.tipo_perfil,
      papel: userData.tipo_perfil, // For backward compatibility
      status: 'ativo',
      saldo_pontos: 0,
      codigo: referralCode // Add the generated referral code
    };

    // Add document fields based on profile type
    if (userData.tipo_perfil === 'lojista') {
      userMetadata.cnpj = userData.cnpj;
    } else {
      userMetadata.cpf = userData.cpf;
    }

    // Add specific fields based on profile type
    if (userData.tipo_perfil === 'profissional' && userData.especialidade_profissional) {
      userMetadata.especialidade_profissional = userData.especialidade_profissional;
      console.log("👨‍🔧 Professional signup with specialty:", userData.especialidade_profissional);
    }

    if (userData.tipo_perfil === 'vendedor' && userData.nome_loja) {
      userMetadata.nome_loja = userData.nome_loja;
    }

    console.log("👤 Creating user with metadata:", { 
      ...userMetadata, 
      codigo: referralCode,
      documento_tipo: userData.tipo_perfil === 'lojista' ? 'CNPJ' : 'CPF'
    });
    
    // Create user with metadata
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: userMetadata
    });
    
    if (error) {
      console.error("❌ Error creating user:", error);
      let statusCode = 500;
      let errorMessage = 'Erro interno do servidor';
      
      // Handle specific error cases
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        statusCode = 409;
        errorMessage = 'Este email já está cadastrado';
      } else if (error.message.includes('Invalid email')) {
        statusCode = 400;
        errorMessage = 'Email inválido';
      } else if (error.message.includes('Password should be at least')) {
        statusCode = 400;
        errorMessage = 'Senha deve ter pelo menos 6 caracteres';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage 
        }),
        { status: statusCode, headers }
      );
    }

    console.log("✅ User created successfully:", data.user?.id);

    // Create profile directly to ensure it exists with referral code
    if (data.user) {
      try {
        const profileData = {
          id: data.user.id,
          nome: userData.nome,
          email: userData.email,
          telefone: userData.telefone || null,
          papel: userData.tipo_perfil,
          tipo_perfil: userData.tipo_perfil,
          especialidade_profissional: userData.especialidade_profissional || null,
          status: 'ativo',
          saldo_pontos: 0,
          codigo: referralCode, // Ensure the referral code is saved
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Add document fields to profile
        if (userData.tipo_perfil === 'lojista') {
          profileData.cnpj = userData.cnpj;
        } else {
          profileData.cpf = userData.cpf;
        }

        console.log("📝 Creating profile directly with referral code:", { 
          id: profileData.id, 
          nome: profileData.nome,
          codigo: profileData.codigo,
          tipo_perfil: profileData.tipo_perfil,
          especialidade_profissional: profileData.especialidade_profissional,
          documento_tipo: userData.tipo_perfil === 'lojista' ? 'CNPJ' : 'CPF'
        });

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error("❌ Error creating profile:", profileError);
          // For professionals, this is critical, so we should return an error
          if (userData.tipo_perfil === 'profissional') {
            return new Response(
              JSON.stringify({ 
                success: false,
                error: 'Erro ao criar perfil profissional: ' + profileError.message 
              }),
              { status: 500, headers }
            );
          } else {
            // Don't fail the signup for other types, but log it
            console.warn("⚠️ Profile creation failed, trigger should handle it");
          }
        } else {
          console.log("✅ Profile created successfully with referral code:", referralCode);
          
          // For professionals, log the successful creation
          if (userData.tipo_perfil === 'profissional') {
            console.log("👨‍🔧 Professional profile created successfully with specialty:", userData.especialidade_profissional);
          }
        }
      } catch (profileCreateError) {
        console.error("❌ Exception creating profile:", profileCreateError);
        // For professionals, return error
        if (userData.tipo_perfil === 'profissional') {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro ao criar perfil profissional' 
            }),
            { status: 500, headers }
          );
        }
      }
    }
    
    // Return success response with referral code
    return new Response(
      JSON.stringify({
        success: true,
        user: data.user,
        referralCode: referralCode,
        message: userData.tipo_perfil === 'profissional' 
          ? 'Cadastro profissional realizado com sucesso!' 
          : 'Cadastro realizado com sucesso!'
      }),
      { status: 201, headers }
    );
    
  } catch (error) {
    console.error("❌ Unexpected error in auth-signup:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro interno do servidor" 
      }),
      { status: 500, headers }
    );
  }
});
