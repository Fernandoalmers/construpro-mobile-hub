
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

    console.log('🔄 [update-pedido-status-safe] Starting validation process:', { 
      pedido_id, 
      vendedor_id, 
      new_status, 
      order_id_to_update 
    })

    // STEP 1: Get basic pedido information first
    console.log('🔍 [update-pedido-status-safe] Step 1: Fetching pedido basic info...')
    const { data: pedidoBasic, error: pedidoBasicError } = await supabaseClient
      .from('pedidos')
      .select('id, vendedor_id, status, order_id, usuario_id')
      .eq('id', pedido_id)
      .single()

    if (pedidoBasicError || !pedidoBasic) {
      console.error('❌ [update-pedido-status-safe] Pedido not found:', pedidoBasicError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Pedido not found',
          details: pedidoBasicError?.message || 'No pedido found with provided ID'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    console.log('✅ [update-pedido-status-safe] Pedido found:', {
      id: pedidoBasic.id,
      vendedor_id: pedidoBasic.vendedor_id, 
      status: pedidoBasic.status,
      order_id: pedidoBasic.order_id
    })

    // STEP 2: Check direct vendor ownership first (simpler check)
    let vendorOwnsOrder = false
    if (pedidoBasic.vendedor_id === vendedor_id) {
      vendorOwnsOrder = true
      console.log('✅ [update-pedido-status-safe] Direct vendor ownership confirmed')
    } else {
      console.log('🔍 [update-pedido-status-safe] Step 2: Checking vendor product ownership...')
      
      // STEP 3: Check if vendor has products in this order (simplified approach)
      try {
        // First get order items for this pedido
        const { data: orderItems, error: itemsError } = await supabaseClient
          .from('itens_pedido')
          .select('produto_id')
          .eq('pedido_id', pedido_id)

        if (itemsError) {
          console.error('⚠️ [update-pedido-status-safe] Error fetching order items:', itemsError)
          // Continue with direct vendor check only
        } else if (orderItems && orderItems.length > 0) {
          console.log(`📦 [update-pedido-status-safe] Found ${orderItems.length} items in order`)
          
          // Get product IDs
          const productIds = orderItems.map(item => item.produto_id)
          
          // Check if any products belong to this vendor
          const { data: vendorProducts, error: productsError } = await supabaseClient
            .from('produtos')
            .select('id')
            .eq('vendedor_id', vendedor_id)
            .in('id', productIds)

          if (productsError) {
            console.error('⚠️ [update-pedido-status-safe] Error checking vendor products:', productsError)
            // Continue with original logic
          } else if (vendorProducts && vendorProducts.length > 0) {
            vendorOwnsOrder = true
            console.log(`✅ [update-pedido-status-safe] Vendor owns ${vendorProducts.length} products in this order`)
          } else {
            console.log('❌ [update-pedido-status-safe] Vendor has no products in this order')
          }
        }
      } catch (error) {
        console.error('⚠️ [update-pedido-status-safe] Error in product ownership check:', error)
        // Continue with basic checks
      }
    }

    // Final permission check
    if (!vendorOwnsOrder) {
      console.error('❌ [update-pedido-status-safe] Access denied:', {
        pedido_vendedor_id: pedidoBasic.vendedor_id,
        requesting_vendedor_id: vendedor_id,
        has_products: false
      })
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Access denied: You do not have permission to update this order',
          details: 'Vendor can only update orders they own or contain their products'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

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

    // STEP 4: Update pedidos table
    console.log('📝 [update-pedido-status-safe] Step 4: Updating pedidos table...')
    const { error: pedidosError } = await supabaseClient
      .from('pedidos')
      .update({ status: new_status })
      .eq('id', pedido_id)

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

    // STEP 5: Update aggregated status for main order
    console.log('📊 [update-pedido-status-safe] Step 5: Calculating aggregated order status...')
    const finalOrderId = order_id_to_update || pedidoBasic.order_id
    
    if (finalOrderId) {
      try {
        // Get all pedidos for this order
        const { data: allPedidos, error: allPedidosError } = await supabaseClient
          .from('pedidos')
          .select('status, vendedor_id')
          .eq('order_id', finalOrderId)

        if (!allPedidosError && allPedidos && allPedidos.length > 0) {
          // Calculate smart aggregated status
          const statuses = allPedidos.map(p => p.status.toLowerCase())
          let aggregatedStatus = 'pendente'

          if (statuses.every(s => s === 'entregue')) {
            aggregatedStatus = 'entregue'
          } else if (statuses.every(s => s === 'cancelado')) {
            aggregatedStatus = 'cancelado'
          } else if (statuses.some(s => s === 'enviado')) {
            aggregatedStatus = 'enviado'
          } else if (statuses.some(s => s === 'processando')) {
            aggregatedStatus = 'processando'
          } else if (statuses.some(s => s === 'confirmado')) {
            aggregatedStatus = 'confirmado'
          }

          console.log('📊 [update-pedido-status-safe] Calculated aggregated status:', {
            individual_statuses: statuses,
            aggregated_status: aggregatedStatus
          })

          // Update orders table with aggregated status
          const { error: ordersError } = await supabaseClient
            .from('orders')
            .update({ status: aggregatedStatus })
            .eq('id', finalOrderId)

          if (ordersError) {
            console.warn('⚠️ [update-pedido-status-safe] Warning updating orders table:', {
              error: ordersError,
              order_id: finalOrderId,
              message: ordersError.message
            })
          } else {
            console.log('✅ [update-pedido-status-safe] Orders table updated with aggregated status:', aggregatedStatus)
          }
        } else {
          console.warn('⚠️ [update-pedido-status-safe] No pedidos found for order:', finalOrderId)
        }
      } catch (error) {
        console.error('⚠️ [update-pedido-status-safe] Error updating aggregated status:', error)
        // Don't fail the main operation for this
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
