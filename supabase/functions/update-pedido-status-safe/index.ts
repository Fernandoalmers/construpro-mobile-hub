
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 [update-pedido-status-safe] Function started')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse and validate request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📝 [update-pedido-status-safe] Request body received:', JSON.stringify(requestBody))
    } catch (error) {
      console.error('❌ [update-pedido-status-safe] Invalid JSON in request body:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    const { pedido_id, vendedor_id, new_status, order_id_to_update } = requestBody

    // Validate required fields
    if (!pedido_id || !vendedor_id || !new_status) {
      console.error('❌ [update-pedido-status-safe] Missing required fields:', { pedido_id, vendedor_id, new_status })
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: pedido_id, vendedor_id, new_status',
          received: { pedido_id: !!pedido_id, vendedor_id: !!vendedor_id, new_status: !!new_status }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('🔄 [update-pedido-status-safe] Updating pedido status safely:', { 
      pedido_id, 
      vendedor_id, 
      new_status, 
      order_id_to_update 
    })

    // Validate that the pedido exists and belongs to the vendor
    console.log('🔍 [update-pedido-status-safe] Validating pedido ownership...')
    const { data: pedidoCheck, error: pedidoCheckError } = await supabaseClient
      .from('pedidos')
      .select('id, vendedor_id, status, order_id')
      .eq('id', pedido_id)
      .eq('vendedor_id', vendedor_id)
      .single()

    if (pedidoCheckError || !pedidoCheck) {
      console.error('❌ [update-pedido-status-safe] Pedido validation failed:', pedidoCheckError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: pedidoCheckError ? 'Pedido not found or access denied' : 'Pedido not found',
          details: pedidoCheckError?.message || 'No pedido found with provided ID and vendor ID'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    console.log('✅ [update-pedido-status-safe] Pedido validation successful:', {
      current_status: pedidoCheck.status,
      new_status: new_status,
      order_id: pedidoCheck.order_id
    })

    // Validate status transition
    const validStatuses = ['pendente', 'confirmado', 'processando', 'enviado', 'entregue', 'cancelado']
    if (!validStatuses.includes(new_status.toLowerCase())) {
      console.error('❌ [update-pedido-status-safe] Invalid status:', new_status)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Invalid status: ${new_status}`,
          valid_statuses: validStatuses
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Step 1: Update pedidos table first
    console.log('📝 [update-pedido-status-safe] Updating pedidos table...')
    const { error: pedidosError } = await supabaseClient
      .from('pedidos')
      .update({ status: new_status })
      .eq('id', pedido_id)
      .eq('vendedor_id', vendedor_id)

    if (pedidosError) {
      console.error('❌ [update-pedido-status-safe] Error updating pedidos table:', {
        error: pedidosError,
        code: pedidosError.code,
        message: pedidosError.message,
        details: pedidosError.details,
        hint: pedidosError.hint
      })
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to update pedidos: ${pedidosError.message}`,
          code: pedidosError.code,
          details: pedidosError.details || pedidosError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    console.log('✅ [update-pedido-status-safe] Pedidos table updated successfully')

    // Step 2: Update orders table if order_id exists
    const finalOrderId = order_id_to_update || pedidoCheck.order_id
    if (finalOrderId) {
      console.log('📝 [update-pedido-status-safe] Updating orders table with order_id:', finalOrderId)
      const { error: ordersError } = await supabaseClient
        .from('orders')
        .update({ status: new_status })
        .eq('id', finalOrderId)

      if (ordersError) {
        console.warn('⚠️ [update-pedido-status-safe] Warning updating orders table:', {
          error: ordersError,
          order_id: finalOrderId,
          message: ordersError.message
        })
        // Don't fail the entire operation if orders update fails
        // The pedidos table is the primary source of truth
        console.log('ℹ️ [update-pedido-status-safe] Continuing with success, pedidos table updated')
      } else {
        console.log('✅ [update-pedido-status-safe] Orders table updated successfully')
      }
    } else {
      console.log('ℹ️ [update-pedido-status-safe] No order_id found, skipping orders table update')
    }

    const result = {
      success: true, 
      message: `Status updated to ${new_status}`,
      pedido_id,
      new_status,
      updated_at: new Date().toISOString()
    }

    console.log('🎉 [update-pedido-status-safe] Operation completed successfully:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 [update-pedido-status-safe] Unexpected error:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
