
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderData, items } = await req.json()
    console.log('🔄 Processing order creation:', { orderData, itemsCount: items?.length })

    // Generate order ID
    const orderId = crypto.randomUUID()
    console.log('📝 Generated order ID:', orderId)

    // Start transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        cliente_id: orderData.cliente_id,
        valor_total: orderData.valor_total,
        status: orderData.status,
        forma_pagamento: orderData.forma_pagamento,
        endereco_entrega: orderData.endereco_entrega,
        pontos_ganhos: orderData.pontos_ganhos || 0,
        cupom_codigo: orderData.cupom_codigo || null,
        desconto_aplicado: orderData.desconto_aplicado || 0,
        reference_id: orderData.reference_id || null
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Error creating order:', orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    console.log('✅ Order created successfully:', order.id)

    // Insert order items
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('❌ Error creating order items:', itemsError)
        // Try to rollback order creation
        await supabase.from('orders').delete().eq('id', orderId)
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      console.log('✅ Order items created successfully:', orderItems.length)
    }

    // Create vendor orders (pedidos) for each vendor
    const vendorOrders = new Map()
    
    if (items && items.length > 0) {
      // Get product vendors
      const productIds = items.map((item: any) => item.produto_id)
      const { data: products, error: productsError } = await supabase
        .from('produtos')
        .select('id, vendedor_id')
        .in('id', productIds)

      if (productsError) {
        console.error('❌ Error fetching products:', productsError)
      } else {
        // Group items by vendor
        for (const item of items) {
          const product = products.find(p => p.id === item.produto_id)
          if (product && product.vendedor_id) {
            if (!vendorOrders.has(product.vendedor_id)) {
              vendorOrders.set(product.vendedor_id, {
                items: [],
                total: 0
              })
            }
            
            const vendorOrder = vendorOrders.get(product.vendedor_id)
            vendorOrder.items.push(item)
            vendorOrder.total += item.subtotal
          }
        }

        // Create pedidos for each vendor
        for (const [vendorId, vendorOrder] of vendorOrders) {
          const pedidoId = crypto.randomUUID()
          
          const { error: pedidoError } = await supabase
            .from('pedidos')
            .insert({
              id: pedidoId,
              order_id: orderId,
              usuario_id: orderData.cliente_id,
              vendedor_id: vendorId,
              status: orderData.status,
              forma_pagamento: orderData.forma_pagamento,
              endereco_entrega: orderData.endereco_entrega,
              valor_total: vendorOrder.total,
              cupom_codigo: orderData.cupom_codigo || null,
              desconto_aplicado: orderData.desconto_aplicado || 0
            })

          if (pedidoError) {
            console.error('❌ Error creating pedido:', pedidoError)
          } else {
            console.log('✅ Pedido created for vendor:', vendorId)

            // Create itens_pedido
            const itensPedido = vendorOrder.items.map((item: any) => ({
              pedido_id: pedidoId,
              produto_id: item.produto_id,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              total: item.subtotal
            }))

            const { error: itensError } = await supabase
              .from('itens_pedido')
              .insert(itensPedido)

            if (itensError) {
              console.error('❌ Error creating itens_pedido:', itensError)
            }
          }
        }
      }
    }

    // NOTE: Points registration is now handled automatically by the database trigger
    // We removed the manual points registration to prevent duplicates
    console.log('✅ Order processing completed. Points will be registered automatically by trigger.')

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: orderId,
        message: 'Order created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Order processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
