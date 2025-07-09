
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
    console.log('🔧 [update-pedido-status-safe] Verificando variáveis de ambiente...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [update-pedido-status-safe] Variáveis de ambiente não configuradas')
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
    
    console.log('✅ [update-pedido-status-safe] Variáveis de ambiente OK')

    // STEP 2: Parse request body
    console.log('📥 [update-pedido-status-safe] Parseando request body...')
    
    let requestBody
    try {
      const rawBody = await req.text()
      console.log('📝 [update-pedido-status-safe] Raw body recebido:', rawBody)
      requestBody = JSON.parse(rawBody)
      console.log('📝 [update-pedido-status-safe] Request body parseado:', JSON.stringify(requestBody, null, 2))
    } catch (error) {
      console.error('❌ [update-pedido-status-safe] Erro ao parsear JSON:', error)
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
    console.log('🔍 [update-pedido-status-safe] Validando campos obrigatórios...')
    console.log('🔍 [update-pedido-status-safe] Parâmetros extraídos:', {
      pedido_id,
      vendedor_id,
      new_status
    })

    if (!pedido_id || !vendedor_id || !new_status) {
      console.error('❌ [update-pedido-status-safe] Campos obrigatórios faltando')
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

    console.log('✅ [update-pedido-status-safe] Campos obrigatórios validados')

    // STEP 4: Create Supabase client
    console.log('🔗 [update-pedido-status-safe] Criando cliente Supabase...')
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ [update-pedido-status-safe] Cliente Supabase criado')

    // STEP 5: Check if pedido exists and get basic info
    console.log('🔍 [update-pedido-status-safe] Verificando se pedido existe...')
    
    try {
      const { data: pedidoExists, error: pedidoError } = await supabaseClient
        .from('pedidos')
        .select('id, vendedor_id, status, usuario_id')
        .eq('id', pedido_id)
        .single()

      console.log('📊 [update-pedido-status-safe] Resultado da busca do pedido:', {
        pedidoExists,
        pedidoError
      })

      if (pedidoError || !pedidoExists) {
        console.error('❌ [update-pedido-status-safe] Pedido não encontrado:', pedidoError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Pedido não encontrado',
            step: 'check_pedido_exists',
            details: pedidoError?.message || 'Nenhum pedido encontrado com o ID fornecido'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      console.log('✅ [update-pedido-status-safe] Pedido encontrado:', {
        id: pedidoExists.id,
        vendedor_id: pedidoExists.vendedor_id, 
        current_status: pedidoExists.status
      })

      // STEP 6: Simple permission check
      console.log('🔍 [update-pedido-status-safe] Verificando permissões...')
      
      if (pedidoExists.vendedor_id !== vendedor_id) {
        console.error('❌ [update-pedido-status-safe] Permissão negada:', {
          pedido_vendedor_id: pedidoExists.vendedor_id,
          request_vendedor_id: vendedor_id
        })
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Acesso negado: Vendedor não é dono do pedido',
            step: 'check_permissions',
            details: 'Vendedor só pode atualizar pedidos próprios'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        )
      }

      console.log('✅ [update-pedido-status-safe] Permissões verificadas')

      // STEP 7: Simple update (without complex status mapping)
      console.log('📝 [update-pedido-status-safe] Atualizando status do pedido...')
      
      const { error: updateError } = await supabaseClient
        .from('pedidos')
        .update({ status: new_status })
        .eq('id', pedido_id)

      if (updateError) {
        console.error('❌ [update-pedido-status-safe] Erro ao atualizar pedido:', {
          error: updateError,
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Falha ao atualizar pedido: ${updateError.message}`,
            step: 'update_pedido',
            code: updateError.code,
            details: updateError.details || updateError
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log('✅ [update-pedido-status-safe] Pedido atualizado com sucesso')

      const result = {
        success: true, 
        message: `Status atualizado para ${new_status}`,
        pedido_id,
        new_status,
        updated_at: new Date().toISOString(),
        step: 'success'
      }

      console.log('🎉 [update-pedido-status-safe] Operação concluída com sucesso:', result)

      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (dbError) {
      console.error('💥 [update-pedido-status-safe] Erro de banco de dados:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      })
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro de banco de dados',
          step: 'database_error',
          message: dbError.message || 'Erro desconhecido no banco de dados',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

  } catch (error) {
    console.error('💥 [update-pedido-status-safe] Erro inesperado:', {
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
