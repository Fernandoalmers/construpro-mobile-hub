
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Importar Supabase corretamente
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Checking coupon validation function status...')

    // Verificar se a função já existe e está funcionando
    const { data: testResult, error: testError } = await supabaseClient.rpc('validate_coupon', {
      coupon_code: 'TEST',
      user_id_param: '00000000-0000-0000-0000-000000000000',
      order_value: 100
    })

    if (testError) {
      console.error('Function test failed:', testError)
      return new Response(
        JSON.stringify({ 
          error: 'Function validation failed',
          details: testError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Coupon validation function is working correctly')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Função validate_coupon está funcionando corretamente',
        test_result: testResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fix-coupon-validation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao verificar função de validação de cupom'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
