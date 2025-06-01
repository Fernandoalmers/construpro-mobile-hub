
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface OrderItem {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  pontos?: number;
}

interface CreateOrderRequest {
  action: string;
  items: OrderItem[];
  endereco_entrega: any;
  forma_pagamento: string;
  valor_total: number;
  pontos_ganhos: number;
  cupom_aplicado?: {
    id: string;
    code: string;
    discount: number;
  } | null;
  desconto: number;
  status?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestData = await req.json()
    console.log('Request data received:', requestData)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Handle different actions
    if (requestData.action === 'create_order') {
      console.log('Processing create_order action')
      
      const orderData = requestData as CreateOrderRequest
      
      // Validate required fields
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order items are required')
      }
      
      if (!orderData.endereco_entrega) {
        throw new Error('Delivery address is required')
      }
      
      if (!orderData.valor_total || orderData.valor_total <= 0) {
        throw new Error('Order total must be greater than zero')
      }

      console.log('Creating order for user:', user.id)
      
      // Create the main order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          cliente_id: user.id,
          status: orderData.status || 'Confirmado',
          forma_pagamento: orderData.forma_pagamento,
          endereco_entrega: orderData.endereco_entrega,
          valor_total: orderData.valor_total,
          pontos_ganhos: orderData.pontos_ganhos || 0,
          cupom_codigo: orderData.cupom_aplicado?.code || null,
          desconto_aplicado: orderData.desconto || 0
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      console.log('Order created successfully:', order.id)

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal || item.preco_unitario * item.quantidade
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Error creating order items:', itemsError)
        // Try to clean up the order if items failed
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      console.log('Order items created successfully')

      // Update inventory
      let inventoryUpdated = true
      try {
        for (const item of orderData.items) {
          const { error: inventoryError } = await supabase.rpc(
            'update_inventory_on_order',
            { 
              p_produto_id: item.produto_id, 
              p_quantidade: item.quantidade 
            }
          )
          
          if (inventoryError) {
            console.error('Error updating inventory for product:', item.produto_id, inventoryError)
            inventoryUpdated = false
          }
        }
      } catch (error) {
        console.error('Exception updating inventory:', error)
        inventoryUpdated = false
      }

      // Register points transaction
      let pointsRegistered = true
      try {
        if (orderData.pontos_ganhos > 0) {
          const { error: pointsError } = await supabase
            .from('points_transactions')
            .insert({
              user_id: user.id,
              pontos: orderData.pontos_ganhos,
              tipo: 'compra',
              descricao: `Pontos por compra #${order.id}`,
              referencia_id: order.id
            })

          if (pointsError) {
            console.error('Error registering points:', pointsError)
            pointsRegistered = false
          } else {
            // Update user points balance
            const { error: updatePointsError } = await supabase.rpc(
              'update_user_points',
              { 
                user_id: user.id, 
                points_to_add: orderData.pontos_ganhos 
              }
            )
            
            if (updatePointsError) {
              console.error('Error updating user points balance:', updatePointsError)
            }
          }
        }
      } catch (error) {
        console.error('Exception registering points:', error)
        pointsRegistered = false
      }

      // Process coupon if applied
      let couponProcessed = true
      try {
        if (orderData.cupom_aplicado && orderData.desconto > 0) {
          const { error: couponError } = await supabase.rpc(
            'apply_coupon',
            {
              coupon_code: orderData.cupom_aplicado.code,
              user_id_param: user.id,
              order_id_param: order.id,
              order_value: orderData.valor_total + orderData.desconto
            }
          )

          if (couponError) {
            console.error('Error processing coupon:', couponError)
            couponProcessed = false
          }
        }
      } catch (error) {
        console.error('Exception processing coupon:', error)
        couponProcessed = false
      }

      // Try to process referral activation (non-blocking)
      try {
        console.log(`Processing referral activation for customer: ${user.id}`)
        
        const referralResponse = await fetch(`${supabaseUrl}/functions/v1/referral-processing`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'activate_referral_on_purchase',
            user_id: user.id
          })
        })
        
        if (referralResponse.ok) {
          const referralResult = await referralResponse.json()
          console.log('Referral processing result:', referralResult.message)
        } else {
          console.error('Referral processing failed:', await referralResponse.text())
        }
      } catch (referralError) {
        console.error('Error processing referral activation:', referralError)
        // Don't fail the order processing if referral fails
      }

      console.log('Order processing completed successfully')

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order created successfully',
          order: {
            id: order.id,
            status: order.status,
            valor_total: order.valor_total,
            pontos_ganhos: order.pontos_ganhos
          },
          inventoryUpdated,
          pointsRegistered,
          couponProcessed
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle legacy order processing (for existing functionality)
    if (requestData.orderData) {
      console.log('Processing legacy order update:', requestData.orderData.id)

      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', requestData.orderData.id)
        .select()

      if (error) {
        console.error('Error updating order status:', error)
        throw error
      }

      console.log('Legacy order updated:', data)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order processed successfully',
          orderId: requestData.orderData.id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If no valid action found
    throw new Error('Invalid request: missing action or orderData')

  } catch (error) {
    console.error('Error processing order:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
