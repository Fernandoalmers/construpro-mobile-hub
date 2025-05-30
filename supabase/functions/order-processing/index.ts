
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, initSupabaseClient, verifyUserToken } from './utils.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Order processing request received');
    
    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header required' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('Empty authorization token');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Valid authorization token required' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('Initializing Supabase client...');
    const supabaseClient = initSupabaseClient(token, true); // Use service role for transactions
    
    console.log('Verifying user authentication...');
    const user = await verifyUserToken(supabaseClient);

    console.log('Parsing request body...');
    const requestBody = await req.json();
    const { action, ...body } = requestBody;

    console.log('Request action:', action);

    // Handle stock validation action
    if (action === 'validate_stock') {
      return await handleStockValidation(supabaseClient, body.items);
    }

    if (action === 'create_order') {
      return await handleOrderCreation(supabaseClient, user, body);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid action specified' 
      }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Unhandled error in order-processing:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + (error.message || 'Unknown error')
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Handle order creation with improved error handling
async function handleOrderCreation(supabaseClient: any, user: any, body: any) {
  try {
    console.log('Processing order creation for user:', user.id);
    
    // Extract and validate required fields
    const {
      items,
      endereco_entrega,
      forma_pagamento,
      valor_total,
      pontos_ganhos,
      cupom_aplicado,
      desconto,
      status
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order items are required');
    }
    
    if (!endereco_entrega) {
      throw new Error('Delivery address is required');
    }
    
    if (!forma_pagamento) {
      throw new Error('Payment method is required');
    }
    
    if (!valor_total || valor_total <= 0) {
      throw new Error('Valid order total is required');
    }

    console.log('Creating order with validated data...');

    let orderId;
    let inventoryUpdated = true;
    let pointsRegistered = true;
    let couponProcessed = true;

    // Create the order
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .insert([{
        cliente_id: user.id,
        endereco_entrega,
        forma_pagamento,
        valor_total,
        pontos_ganhos: pontos_ganhos || 0,
        status: status || 'Confirmado',
        cupom_codigo: cupom_aplicado?.code || null,
        desconto: desconto || 0
      }])
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    orderId = orderData.id;
    console.log('Order created successfully with ID:', orderId);

    // Create order items and update inventory
    for (const item of items) {
      try {
        // Create order item
        const { error: itemError } = await supabaseClient
          .from('order_items')
          .insert([{
            order_id: orderId,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
            pontos: item.pontos || 0
          }]);

        if (itemError) {
          console.error('Error creating order item:', itemError);
          throw new Error(`Failed to create order item: ${itemError.message}`);
        }

        // Update product inventory
        const { error: updateError } = await supabaseClient
          .from('produtos')
          .update({ 
            estoque: supabaseClient.raw('GREATEST(0, estoque - ?)', [item.quantidade])
          })
          .eq('id', item.produto_id);

        if (updateError) {
          console.error('Error updating inventory:', updateError);
          inventoryUpdated = false;
        }
      } catch (itemError) {
        console.error('Error processing item:', itemError);
        inventoryUpdated = false;
      }
    }

    // Register points transaction if points are awarded
    if (pontos_ganhos && pontos_ganhos > 0) {
      try {
        const { error: pointsError } = await supabaseClient
          .from('points_transactions')
          .insert([{
            user_id: user.id,
            pontos: pontos_ganhos,
            tipo: 'compra',
            descricao: `Pontos por compra #${orderId}`,
            referencia_id: orderId
          }]);

        if (pointsError) {
          console.error('Error registering points:', pointsError);
          pointsRegistered = false;
        } else {
          // Update user total points
          const { error: updatePointsError } = await supabaseClient
            .from('profiles')
            .update({ 
              saldo_pontos: supabaseClient.raw('COALESCE(saldo_pontos, 0) + ?', [pontos_ganhos])
            })
            .eq('id', user.id);

          if (updatePointsError) {
            console.error('Error updating user points:', updatePointsError);
          }
        }
      } catch (pointsError) {
        console.error('Points processing error:', pointsError);
        pointsRegistered = false;
      }
    }

    // Process coupon if applicable
    if (cupom_aplicado && cupom_aplicado.id && desconto > 0) {
      try {
        const { error: couponError } = await supabaseClient
          .from('coupons')
          .update({ 
            used_count: supabaseClient.raw('used_count + 1')
          })
          .eq('id', cupom_aplicado.id);

        if (couponError) {
          console.error('Error updating coupon:', couponError);
          couponProcessed = false;
        }
      } catch (couponError) {
        console.error('Coupon processing error:', couponError);
        couponProcessed = false;
      }
    }

    console.log('Order processing completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        order: { id: orderId },
        inventoryUpdated,
        pointsRegistered,
        couponProcessed
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Order creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create order' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Stock validation function
async function handleStockValidation(supabaseClient: any, items: any[]) {
  try {
    console.log('Validating stock for', items.length, 'items');
    
    const failedItems: string[] = [];
    
    for (const item of items) {
      const { data: product, error: stockError } = await supabaseClient
        .from('produtos')
        .select('id, nome, estoque')
        .eq('id', item.produto_id)
        .single();
        
      if (stockError || !product) {
        console.error('Product not found:', item.produto_id);
        failedItems.push(item.produto_id);
        continue;
      }
      
      if (product.estoque < item.quantidade) {
        console.error('Insufficient stock for product:', product.nome);
        failedItems.push(item.produto_id);
      }
    }
    
    if (failedItems.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Some products do not have sufficient stock',
          failedItems
        }),
        { headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Stock validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Stock validation failed: ' + error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
