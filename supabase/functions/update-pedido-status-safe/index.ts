
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

    // STEP 4: Validate status
    console.log('🔍 STEP 4: Validando status...')
    
    const validStatuses = ['pendente', 'confirmado', 'processando', 'enviado', 'entregue', 'cancelado']
    if (!validStatuses.includes(new_status)) {
      console.error('❌ STEP 4 FAILED: Status inválido:', new_status)
      console.error('Status válidos:', validStatuses)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Status inválido: ${new_status}`,
          step: 'validate_status',
          valid_statuses: validStatuses
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('✅ STEP 4 SUCCESS: Status válido:', new_status)

    // STEP 5: Create Supabase client
    console.log('🔗 STEP 5: Criando cliente Supabase...')
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ STEP 5 SUCCESS: Cliente Supabase criado')

    // STEP 6: Check if pedido exists and get info
    console.log('🔍 STEP 6: Verificando se pedido existe...')
    
    try {
      const { data: pedidoExists, error: pedidoError } = await supabaseClient
        .from('pedidos')
        .select('id, vendedor_id, status, usuario_id')
        .eq('id', pedido_id)
        .single()

      console.log('📊 Resultado da busca do pedido:', {
        pedidoExists,
        pedidoError
      })

      if (pedidoError || !pedidoExists) {
        console.error('❌ STEP 6 FAILED: Pedido não encontrado:', pedidoError)
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

      console.log('✅ STEP 6 SUCCESS: Pedido encontrado:', {
        id: pedidoExists.id,
        vendedor_id: pedidoExists.vendedor_id, 
        current_status: pedidoExists.status
      })

      // STEP 7: Permission check
      console.log('🔍 STEP 7: Verificando permissões...')
      
      if (pedidoExists.vendedor_id !== vendedor_id) {
        console.error('❌ STEP 7 FAILED: Permissão negada:', {
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

      console.log('✅ STEP 7 SUCCESS: Permissões verificadas')

      // STEP 8: Update pedido status (ONLY PEDIDOS TABLE - SIMPLIFIED)
      console.log('📝 STEP 8: Atualizando status do pedido na tabela pedidos...')
      
      const { error: updatePedidoError } = await supabaseClient
        .from('pedidos')
        .update({ status: new_status })
        .eq('id', pedido_id)

      if (updatePedidoError) {
        console.error('❌ STEP 8 FAILED: Erro ao atualizar pedido:', updatePedidoError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Falha ao atualizar pedido: ${updatePedidoError.message}`,
            step: 'update_pedido',
            code: updatePedidoError.code,
            details: updatePedidoError.details || updatePedidoError
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }

      console.log('✅ STEP 8 SUCCESS: Pedido atualizado com sucesso')
      console.log('🎯 SIMPLIFICADO: Sincronização com tabela orders removida temporariamente')

      const result = {
        success: true, 
        message: `Status atualizado para ${new_status}`,
        pedido_id,
        new_status,
        updated_at: new Date().toISOString(),
        step: 'success',
        note: 'Sincronização com tabela orders temporariamente desabilitada'
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
      console.error('💥 Erro de banco de dados:', {
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
