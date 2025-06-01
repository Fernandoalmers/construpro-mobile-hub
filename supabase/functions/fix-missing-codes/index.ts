
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Generate a random referral code
 */
function generateReferralCode(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
      return code;
    }
    
    attempts++;
  }
  
  // Fallback: generate longer code if all attempts failed
  return generateReferralCode(8);
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Fix missing codes function called');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find users without referral codes
    console.log('🔍 Finding users without referral codes...');
    const { data: usersWithoutCodes, error: fetchError } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .or('codigo.is.null,codigo.eq.')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!usersWithoutCodes || usersWithoutCodes.length === 0) {
      console.log('✅ No users found without referral codes');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users need code generation',
          fixed: 0
        }),
        { headers: corsHeaders }
      );
    }

    console.log(`📋 Found ${usersWithoutCodes.length} users without referral codes`);

    let fixedCount = 0;
    const errors = [];

    // Generate codes for each user
    for (const user of usersWithoutCodes) {
      try {
        console.log(`🎲 Generating code for user: ${user.nome} (${user.email})`);
        
        const newCode = await generateUniqueReferralCode(supabase);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ codigo: newCode })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user ${user.nome}:`, updateError);
          errors.push(`${user.nome}: ${updateError.message}`);
        } else {
          console.log(`✅ Generated code ${newCode} for ${user.nome}`);
          fixedCount++;
        }
      } catch (userError) {
        console.error(`❌ Error processing user ${user.nome}:`, userError);
        errors.push(`${user.nome}: ${userError.message}`);
      }
    }

    console.log(`🎉 Processo concluído: ${fixedCount} usuários corrigidos`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fixed ${fixedCount} users`,
        fixed: fixedCount,
        total: usersWithoutCodes.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Error in fix-missing-codes:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
});
