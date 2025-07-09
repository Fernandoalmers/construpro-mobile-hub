
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CORRECTED: Mapeamento de status da tabela pedidos para orders
// Baseado no constraint da tabela orders: 'Confirmado', 'Em Separação', 'Em Trânsito', 'Entregue', 'Cancelado'
const STATUS_MAPPING = {
  'pendente': 'Confirmado',
  'confirmado': 'Confirmado', 
  'processando': 'Em Separação',
  'preparando': 'Em Separação',
  'enviado': 'Em Trânsito',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado'
}

// Status válidos para pedidos
const VALID_PEDIDOS_STATUS = ['pendente', 'confirmado', 'processando', 'preparando', 'enviado', 'entregue', 'cancelado']

// Status válidos para orders (conforme constraint)
const VALID_ORDERS_STATUS = ['Confirmado', 'Em Separação', 'Em Trânsito', 'Entregue', 'Cancelado']

// Função para mapear status de pedidos para orders
function mapPedidoStatusToOrder(pedidoStatus: string): string {
  const normalizedStatus = pedidoStatus.toLowerCase()
  const mappedStatus = STATUS_MAPPING[normalizedStatus]
  
  if (!mappedStatus) {
    console.warn(`⚠️ [update-pedido-status-safe] Status não mapeado: ${pedidoStatus}, usando fallback 'Confirmado'`)
    return 'Confirmado'
  }
  
  // Validar se o status mapeado é válido para orders
  if (!VALID_ORDERS_STATUS.includes(mappedStatus)) {
    console.error(`❌ [update-pedido-status-safe] Status mapeado inválido: ${mappedStatus}, usando fallback 'Confirmado'`)
    return 'Confirmado'
  }
  
  console.log(`✅ [update-pedido-status-safe] Status mapeado: ${pedidoStatus} → ${mappedStatus}`)
  return mappedStatus
}

// Função para calcular status agregado com mapeamento correto
function calculateAggregatedOrderStatus(allPedidosStatuses: string[]): string {
  console.log('📊 [update-pedido-status-safe] Calculando status agregado de:', allPedidosStatuses)
  
  if (allPedidosStatuses.length === 0) {
    return 'Confirmado'
  }

  // Mapear todos os status para o formato de orders
  const mappedStatuses = allPedidosStatuses.map(status => mapPedidoStatusToOrder(status))
  console.log('📊 [update-pedido-status-safe] Status mapeados:', mappedStatuses)
  
  // Lógica de prioridade para status agregado
  if (mappedStatuses.every(s => s === 'Entregue')) {
    return 'Entregue'
  } else if (mappedStatuses.every(s => s === 'Cancelado')) {
    return 'Cancelado'
  } else if (mappedStatuses.some(s => s === 'Em Trânsito')) {
    return 'Em Trânsito'
  } else if (mappedStatuses.some(s => s === 'Em Separação')) {
    return 'Em Separação'
  } else {
    return 'Confirmado'
  }
}

Deno.serve(async (req) => {
  console.log(`🚀 [update-pedido-status-safe] INÍCIO - ${req.method} ${req.url}`)
  console.log(`🔍 [update-pedido-status-safe] Headers recebidos:`, Object.fromEntries(req.headers.entries()))
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [update-pedido-status-safe] Respondendo CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔗 [update-pedido-status-safe] Criando cliente Supabase...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔧 [update-pedido-status-safe] Variáveis de ambiente:', {
      supabaseUrl: supabaseUrl ? 'definida' : 'indefinida',
      supabaseServiceKey: supabaseServiceKey ? 'definida' : 'indefinida'
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [update-pedido-status-safe] Variáveis de ambiente não configuradas')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuração do servidor inválida',
          details: 'Variáveis de ambiente não configuradas'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ [update-pedido-status-safe] Cliente Supabase criado com sucesso')

    // Parse and validate request body
    let requestBody
    try {
      const rawBody = await req.text()
      console.log('📥 [update-pedido-status-safe] Raw body recebido:', rawBody)
      requestBody = JSON.parse(rawBody)
      console.log('📝 [update-pedido-status-safe] Request body parseado:', JSON.stringify(requestBody, null, 2))
    } catch (error) {
      console.error('❌ [update-pedido-status-safe] Erro ao parsear JSON:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'JSON inválido no corpo da requisição',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const { pedido_id, vendedor_id, new_status, order_id_to_update } = requestBody

    console.log('🔍 [update-pedido-status-safe] Parâmetros extraídos:', {
      pedido_id,
      vendedor_id,
      new_status,
      order_id_to_update
    })

    // Validate required fields
    if (!pedido_id || !vendedor_id || !new_status) {
      console.error('❌ [update-pedido-status-safe] Campos obrigatórios faltando:', { 
        pedido_id: !!pedido_id, 
        vendedor_id: !!vendedor_id, 
        new_status: !!new_status 
      })
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Campos obrigatórios faltando: pedido_id, vendedor_id, new_status',
          received: { pedido_id: !!pedido_id, vendedor_id: !!vendedor_id, new_status: !!new_status }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Validate pedido status
    if (!VALID_PEDIDOS_STATUS.includes(new_status.toLowerCase())) {
      console.error('❌ [update-pedido-status-safe] Status de pedido inválido:', new_status)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Status de pedido inválido: ${new_status}`,
          valid_statuses: VALID_PEDIDOS_STATUS
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Map the status for orders table
    const mappedOrderStatus = mapPedidoStatusToOrder(new_status)
    console.log('🔄 [update-pedido-status-safe] Status mapeado:', { 
      pedido_status: new_status,
      mapped_order_status: mappedOrderStatus
    })

    console.log('🔄 [update-pedido-status-safe] STEP 1: Iniciando processo de validação...')

    // STEP 1: Get basic pedido information first
    console.log('🔍 [update-pedido-status-safe] Buscando informações básicas do pedido...')
    try {
      const { data: pedidoBasic, error: pedidoBasicError } = await supabaseClient
        .from('pedidos')
        .select('id, vendedor_id, status, order_id, usuario_id')
        .eq('id', pedido_id)
        .single()

      console.log('📊 [update-pedido-status-safe] Resultado da busca do pedido:', {
        pedidoBasic,
        pedidoBasicError
      })

      if (pedidoBasicError || !pedidoBasic) {
        console.error('❌ [update-pedido-status-safe] Pedido não encontrado:', pedidoBasicError)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Pedido não encontrado',
            details: pedidoBasicError?.message || 'Nenhum pedido encontrado com o ID fornecido'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      console.log('✅ [update-pedido-status-safe] Pedido encontrado:', {
        id: pedidoBasic.id,
        vendedor_id: pedidoBasic.vendedor_id, 
        current_status: pedidoBasic.status,
        order_id: pedidoBasic.order_id
      })

      // STEP 2: Simplified permission check
      console.log('🔍 [update-pedido-status-safe] STEP 2: Verificando permissões...')
      console.log('🔍 [update-pedido-status-safe] Comparando vendedores:', {
        pedido_vendedor_id: pedidoBasic.vendedor_id,
        request_vendedor_id: vendedor_id,
        types: {
          pedido_vendedor_type: typeof pedidoBasic.vendedor_id,
          request_vendedor_type: typeof vendedor_id
        }
      })
      
      let vendorOwnsOrder = false
      if (pedidoBasic.vendedor_id === vendedor_id) {
        vendorOwnsOrder = true
        console.log('✅ [update-pedido-status-safe] Permissão confirmada: vendedor é dono do pedido')
      } else {
        console.log('❌ [update-pedido-status-safe] Permissão negada: vendedor não é dono do pedido')
      }

      // Final permission check
      if (!vendorOwnsOrder) {
        console.error('❌ [update-pedido-status-safe] Acesso negado:', {
          pedido_vendedor_id: pedidoBasic.vendedor_id,
          requesting_vendedor_id: vendedor_id
        })
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Acesso negado: Você não tem permissão para atualizar este pedido',
            details: 'Vendedor só pode atualizar pedidos próprios'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        )
      }

      // STEP 3: Update pedidos table
      console.log('📝 [update-pedido-status-safe] STEP 3: Atualizando tabela pedidos...')
      const { error: pedidosError } = await supabaseClient
        .from('pedidos')
        .update({ status: new_status })
        .eq('id', pedido_id)

      if (pedidosError) {
        console.error('❌ [update-pedido-status-safe] Erro ao atualizar tabela pedidos:', {
          error: pedidosError,
          code: pedidosError.code,
          message: pedidosError.message,
          details: pedidosError.details,
          hint: pedidosError.hint
        })
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Falha ao atualizar pedidos: ${pedidosError.message}`,
            code: pedidosError.code,
            details: pedidosError.details || pedidosError
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
      console.log('✅ [update-pedido-status-safe] Tabela pedidos atualizada com sucesso')

      // STEP 4: Update aggregated status for main order
      console.log('📊 [update-pedido-status-safe] STEP 4: Calculando status agregado do pedido...')
      const finalOrderId = order_id_to_update || pedidoBasic.order_id
      
      if (finalOrderId) {
        try {
          // Get all pedidos for this order
          const { data: allPedidos, error: allPedidosError } = await supabaseClient
            .from('pedidos')
            .select('status, vendedor_id')
            .eq('order_id', finalOrderId)

          console.log('📊 [update-pedido-status-safe] Todos os pedidos para o order_id:', {
            finalOrderId,
            allPedidos,
            allPedidosError
          })

          if (!allPedidosError && allPedidos && allPedidos.length > 0) {
            // Calculate smart aggregated status with mapping
            const statuses = allPedidos.map(p => p.status.toLowerCase())
            const aggregatedStatus = calculateAggregatedOrderStatus(statuses)

            console.log('📊 [update-pedido-status-safe] Cálculo de status:', {
              individual_statuses: statuses,
              aggregated_status: aggregatedStatus,
              mapping_applied: true,
              will_update_orders_table_with: aggregatedStatus
            })

            // CRITICAL: Log exactly what status we're sending to orders table
            console.log(`🎯 [update-pedido-status-safe] PRESTES A ATUALIZAR TABELA ORDERS COM STATUS: "${aggregatedStatus}"`)
            console.log(`🎯 [update-pedido-status-safe] Status válidos para orders: ${JSON.stringify(VALID_ORDERS_STATUS)}`)
            console.log(`🎯 [update-pedido-status-safe] Status é válido? ${VALID_ORDERS_STATUS.includes(aggregatedStatus)}`)

            // Update orders table with mapped aggregated status
            const { error: ordersError } = await supabaseClient
              .from('orders')
              .update({ status: aggregatedStatus })
              .eq('id', finalOrderId)

            if (ordersError) {
              console.error('❌ [update-pedido-status-safe] Erro ao atualizar tabela orders:', {
                error: ordersError,
                order_id: finalOrderId,
                message: ordersError.message,
                attempted_status: aggregatedStatus,
                code: ordersError.code,
                details: ordersError.details,
                hint: ordersError.hint
              })
              return new Response(
                JSON.stringify({ 
                  success: false,
                  error: `Falha ao atualizar tabela orders: ${ordersError.message}`,
                  details: ordersError.details || ordersError,
                  attempted_status: aggregatedStatus,
                  valid_statuses: VALID_ORDERS_STATUS,
                  code: ordersError.code
                }),
                { 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 500 
                }
              )
            } else {
              console.log('✅ [update-pedido-status-safe] Tabela orders atualizada com status agregado mapeado:', aggregatedStatus)
            }
          } else {
            console.warn('⚠️ [update-pedido-status-safe] Nenhum pedido encontrado para o order:', finalOrderId)
          }
        } catch (error) {
          console.error('❌ [update-pedido-status-safe] Erro ao atualizar status agregado:', error)
          return new Response(
            JSON.stringify({ 
              success: false,
              error: `Erro ao calcular status agregado: ${error.message}`,
              details: error
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }
      } else {
        console.log('ℹ️ [update-pedido-status-safe] Nenhum order_id encontrado, pulando atualização da tabela orders')
      }

      const result = {
        success: true, 
        message: `Status atualizado para ${new_status}`,
        pedido_id,
        new_status,
        mapped_order_status: mappedOrderStatus,
        updated_at: new Date().toISOString()
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
