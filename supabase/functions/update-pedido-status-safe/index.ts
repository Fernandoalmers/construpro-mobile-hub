
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log(`🚀 [update-pedido-status-safe] INÍCIO - ${req.method} ${req.url}`)
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [update-pedido-status-safe] Respondendo CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // STEP 1: Environment check
    console.log('🔧 STEP 1: Verificando variáveis de ambiente...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ STEP 1 FAILED: Variáveis de ambiente não configuradas')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuração do servidor inválida',
          step: 'environment_check'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    console.log('✅ STEP 1 SUCCESS: Variáveis de ambiente OK')

    // STEP 2: Parse request body
    console.log('📥 STEP 2: Parseando request body...')
    
    let requestBody
    try {
      const rawBody = await req.text()
      console.log('📝 Raw body recebido:', rawBody)
      requestBody = JSON.parse(rawBody)
      console.log('📝 Request body parseado:', JSON.stringify(requestBody, null, 2))
    } catch (error) {
      console.error('❌ STEP 2 FAILED: Erro ao parsear JSON:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'JSON inválido no corpo da requisição',
          step: 'parse_body',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const { pedido_id, vendedor_id, new_status } = requestBody

    // STEP 3: Validate required fields
    console.log('🔍 STEP 3: Validando campos obrigatórios...')
    console.log('🔍 Parâmetros extraídos:', {
      pedido_id,
      vendedor_id,
      new_status
    })

    if (!pedido_id || !vendedor_id || !new_status) {
      console.error('❌ STEP 3 FAILED: Campos obrigatórios faltando')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Campos obrigatórios faltando: pedido_id, vendedor_id, new_status',
          step: 'validate_fields',
          received: { pedido_id: !!pedido_id, vendedor_id: !!vendedor_id, new_status: !!new_status }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('✅ STEP 3 SUCCESS: Campos obrigatórios validados')

    // STEP 4: Create Supabase client
    console.log('🔗 STEP 4: Criando cliente Supabase...')
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ STEP 4 SUCCESS: Cliente Supabase criado')

    // STEP 5: Call the secure Postgres function
    console.log('🔧 STEP 5: Chamando função Postgres segura...')
    
    try {
      const { data: functionResult, error: functionError } = await supabaseClient
        .rpc('update_pedido_status_secure', {
          p_pedido_id: pedido_id,
          p_vendedor_id: vendedor_id,
          p_new_status: new_status
        })

      console.log('📊 Resultado da função Postgres:', {
        functionResult,
        functionError
      })

      if (functionError) {
        console.error('❌ STEP 5 FAILED: Erro na função Postgres:', functionError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Erro na função Postgres: ${functionError.message}`,
            step: 'postgres_function_error',
            details: functionError
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      if (!functionResult || !functionResult.success) {
        const errorMessage = functionResult?.error || 'Erro desconhecido na função'
        console.error('❌ STEP 5 FAILED: Função retornou erro:', functionResult)
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: errorMessage,
            step: 'postgres_function_business_error',
            details: functionResult
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('✅ STEP 5 SUCCESS: Status atualizado com sucesso via função Postgres')

      const result = {
        success: true, 
        message: functionResult.message,
        pedido_id: functionResult.pedido_id,
        new_status: functionResult.new_status,
        updated_at: functionResult.updated_at,
        step: 'success'
      }

      console.log('🎉 Operação concluída com sucesso:', result)

      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (dbError) {
      console.error('💥 Erro ao chamar função Postgres:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      })
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao executar função de atualização',
          step: 'postgres_function_call_error',
          message: dbError.message || 'Erro desconhecido na chamada da função',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Erro interno do servidor',
        step: 'unexpected_error',
        message: error.message || 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
