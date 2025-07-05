
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
    console.log('=== ORDER PROCESSING EDGE FUNCTION START ===')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const requestData = await req.json()
    console.log('=== REQUEST DATA RECEIVED ===')
    console.log('Full request data:', JSON.stringify(requestData, null, 2))
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
      throw new Error('Server configuration error')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Service client created successfully')

    // Enhanced authentication validation
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      throw new Error('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token || token.length < 10) {
      console.error('❌ Invalid token format')
      throw new Error('Invalid token format')
    }
    
    console.log('🔐 Creating user client with token (length:', token.length, ')')
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    console.log('🔍 Validating user authentication...')
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    
    if (userError) {
      console.error('❌ User authentication error:', userError)
      throw new Error(`Authentication failed: ${userError.message}`)
    }
    
    if (!user) {
      console.error('❌ No user found from token')
      throw new Error('Invalid user token - no user found')
    }
    
    console.log('✅ User authenticated successfully:', { id: user.id, email: user.email })

    // Handle different actions
    if (requestData.action === 'create_order') {
      console.log('=== PROCESSING CREATE_ORDER ACTION ===')
      
      const orderData = requestData as CreateOrderRequest
      console.log('Order data structure:', {
        hasItems: !!orderData.items,
        itemsLength: orderData.items?.length,
        hasEnderecoEntrega: !!orderData.endereco_entrega,
        valorTotal: orderData.valor_total,
        pontosGanhos: orderData.pontos_ganhos,
        formaPagamento: orderData.forma_pagamento
      })
      
      // Enhanced field validation with detailed logging
      if (!orderData.items || orderData.items.length === 0) {
        console.error('❌ Validation failed: No items provided')
        throw new Error('Order items are required')
      }
      
      if (!orderData.endereco_entrega) {
        console.error('❌ Validation failed: No delivery address provided')
        throw new Error('Delivery address is required')
      }
      
      // Validate address structure
      const endereco = orderData.endereco_entrega
      if (!endereco.rua || !endereco.cidade || !endereco.estado || !endereco.cep) {
        console.error('❌ Address validation failed:', {
          hasRua: !!endereco.rua,
          hasCidade: !!endereco.cidade,
          hasEstado: !!endereco.estado,
          hasCep: !!endereco.cep,
          fullAddress: endereco
        })
        throw new Error('Incomplete delivery address - missing required fields')
      }
      
      if (!orderData.valor_total || orderData.valor_total <= 0) {
        console.error('❌ Validation failed: Invalid order total:', orderData.valor_total)
        throw new Error('Order total must be greater than zero')
      }

      console.log('✅ All validations passed. Creating order for user:', user.id)
      
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

      // Update inventory with enhanced error handling
      console.log('=== UPDATING INVENTORY ===')
      let inventoryUpdated = true
      try {
        for (const item of orderData.items) {
          console.log(`Updating inventory for product: ${item.produto_id}, quantity: ${item.quantidade}`)
          
          const { data: rpcData, error: inventoryError } = await supabase.rpc(
            'update_inventory_on_order',
            { 
              p_produto_id: item.produto_id, 
              p_quantidade: item.quantidade 
            }
          )
          
          if (inventoryError) {
            console.error('❌ Error updating inventory for product:', item.produto_id, inventoryError)
            console.error('RPC Error details:', {
              code: inventoryError.code,
              message: inventoryError.message,
              details: inventoryError.details,
              hint: inventoryError.hint
            })
            inventoryUpdated = false
          } else {
            console.log(`✅ Inventory updated successfully for product: ${item.produto_id}`)
          }
        }
      } catch (error) {
        console.error('❌ Exception updating inventory:', error)
        inventoryUpdated = false
      }
      
      console.log('Inventory update completed. Success:', inventoryUpdated)

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
