
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UserRole = 'consumidor' | 'profissional' | 'lojista';

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

/**
 * Validate CPF format (11 digits)
 */
function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11;
}

/**
 * Validate CNPJ format (14 digits)
 */
function validateCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  return cleanCNPJ.length === 14;
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
    console.log("🚀 Auth signup function called - v6.0 with detailed professional signup debugging");
    
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
        has_cnpj: !!userData.cnpj,
        cpf_length: userData.cpf ? userData.cpf.replace(/\D/g, '').length : 0,
        cnpj_length: userData.cnpj ? userData.cnpj.replace(/\D/g, '').length : 0
      });
    } catch (parseError) {
      console.error("❌ Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Dados inválidos no corpo da requisição',
          details: parseError.message 
        }),
        { status: 400, headers }
      );
    }
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.nome) {
      console.error("❌ Missing required basic fields");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Email, senha e nome são obrigatórios' 
        }),
        { status: 400, headers }
      )
    }
    
    // Detailed validation based on profile type
    console.log(`🔍 Validating fields for profile type: ${userData.tipo_perfil}`);
    
    if (userData.tipo_perfil === 'lojista') {
      console.log("🏪 Validating lojista fields...");
      if (!userData.cnpj) {
        console.error("❌ Missing CNPJ for lojista");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CNPJ é obrigatório para lojistas' 
          }),
          { status: 400, headers }
        )
      }
      if (!validateCNPJ(userData.cnpj)) {
        console.error(`❌ Invalid CNPJ format for lojista: ${userData.cnpj} (length: ${userData.cnpj.replace(/\D/g, '').length})`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CNPJ deve ter 14 dígitos' 
          }),
          { status: 400, headers }
        )
      }
      if (!userData.nome_loja) {
        console.error("❌ Missing nome_loja for lojista");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Nome da loja é obrigatório para lojistas' 
          }),
          { status: 400, headers }
        )
      }
      console.log("✅ Lojista validation passed");
    } else if (userData.tipo_perfil === 'profissional') {
      console.log("👨‍🔧 Validating profissional fields...");
      
      if (!userData.cpf) {
        console.error("❌ Missing CPF for profissional");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CPF é obrigatório para profissionais' 
          }),
          { status: 400, headers }
        )
      }
      
      if (!validateCPF(userData.cpf)) {
        console.error(`❌ Invalid CPF format for profissional: ${userData.cpf} (length: ${userData.cpf.replace(/\D/g, '').length})`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CPF deve ter 11 dígitos' 
          }),
          { status: 400, headers }
        )
      }
      
      if (!userData.especialidade_profissional) {
        console.error("❌ Missing especialidade_profissional for profissional");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Especialidade é obrigatória para profissionais' 
          }),
          { status: 400, headers }
        )
      }
      
      console.log("✅ Profissional validation passed");
    } else if (userData.tipo_perfil === 'consumidor') {
      console.log("👤 Validating consumidor fields...");
      
      if (!userData.cpf) {
        console.error("❌ Missing CPF for consumidor");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CPF é obrigatório para consumidores' 
          }),
          { status: 400, headers }
        )
      }
      
      if (!validateCPF(userData.cpf)) {
        console.error(`❌ Invalid CPF format for consumidor: ${userData.cpf} (length: ${userData.cpf.replace(/\D/g, '').length})`);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'CPF deve ter 11 dígitos' 
          }),
          { status: 400, headers }
        )
      }
      
      console.log("✅ Consumidor validation passed");
    } else {
      console.error(`❌ Invalid profile type: ${userData.tipo_perfil}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Tipo de perfil inválido' 
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
      userMetadata.nome_loja = userData.nome_loja;
    } else {
      userMetadata.cpf = userData.cpf;
    }

    // Add specific fields based on profile type
    if (userData.tipo_perfil === 'profissional' && userData.especialidade_profissional) {
      userMetadata.especialidade_profissional = userData.especialidade_profissional;
      console.log("👨‍🔧 Professional signup with specialty:", userData.especialidade_profissional);
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
          error: errorMessage,
          details: error.message
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
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro ao criar perfil: ' + profileError.message,
              details: profileError
            }),
            { status: 500, headers }
          );
        } else {
          console.log("✅ Profile created successfully with referral code:", referralCode);
          
          // For professionals, log the successful creation
          if (userData.tipo_perfil === 'profissional') {
            console.log("👨‍🔧 Professional profile created successfully with specialty:", userData.especialidade_profissional);
          }
        }
      } catch (profileCreateError) {
        console.error("❌ Exception creating profile:", profileCreateError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Erro ao criar perfil',
            details: profileCreateError.message
          }),
          { status: 500, headers }
        );
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
          : userData.tipo_perfil === 'lojista'
          ? 'Cadastro de lojista realizado com sucesso!'
          : 'Cadastro realizado com sucesso!'
      }),
      { status: 201, headers }
    );
    
  } catch (error) {
    console.error("❌ Unexpected error in auth-signup:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro interno do servidor",
        details: error.stack
      }),
      { status: 500, headers }
    );
  }
});
