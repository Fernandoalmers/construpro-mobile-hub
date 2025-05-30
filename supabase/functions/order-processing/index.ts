import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, initUserClient, initServiceRoleClient, verifyUserToken } from './utils.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Order processing request received');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
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

    console.log('Initializing Supabase clients...');
    
    // Initialize both clients
    const userClient = initUserClient(token);
    const serviceClient = initServiceRoleClient();
    
    console.log('Verifying user authentication...');
    const user = await verifyUserToken(userClient);

    console.log('Parsing request body...');
    
    let requestBody;
    
    try {
      // Get the raw body text first
      const bodyText = await req.text();
      console.log('Raw body length:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Request body is empty');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Request body is required' 
          }),
          { status: 400, headers: corsHeaders }
        );
      }
      
      // Parse JSON
      requestBody = JSON.parse(bodyText);
      console.log('Successfully parsed request body');
      console.log('Body keys:', Object.keys(requestBody));
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body: ' + parseError.message 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { action, ...body } = requestBody;
    console.log('Request action:', action);

    // Handle stock validation action
    if (action === 'validate_stock') {
      return await handleStockValidation(serviceClient, body.items);
    }

    if (action === 'create_order') {
      return await handleOrderCreation(serviceClient, user, body);
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
    console.error('Error stack:', error.stack);
    
    // Return 401 for authentication errors, 500 for others
    const status = error.message?.includes('Authentication') || error.message?.includes('authorization') ? 401 : 500;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      { status, headers: corsHeaders }
    );
  }
});

// Handle order creation with improved error handling and validation
async function handleOrderCreation(serviceClient: any, user: any, body: any) {
  try {
    console.log('Processing order creation for user:', user.id);
    console.log('Order body received:', JSON.stringify(body, null, 2));
    
    // Extract and validate required fields with better error messages
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

    // Validate required fields with detailed error messages
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items:', items);
      throw new Error('Itens do pedido são obrigatórios e devem ser uma lista válida');
    }
    
    if (!endereco_entrega || typeof endereco_entrega !== 'object') {
      console.error('Invalid address:', endereco_entrega);
      throw new Error('Endereço de entrega é obrigatório');
    }
    
    // Validate address fields
    const requiredAddressFields = ['rua', 'cidade', 'estado', 'cep'];
    const missingFields = requiredAddressFields.filter(field => !endereco_entrega[field]);
    if (missingFields.length > 0) {
      console.error('Missing address fields:', missingFields);
      throw new Error(`Campos obrigatórios do endereço ausentes: ${missingFields.join(', ')}`);
    }
    
    if (!forma_pagamento) {
      console.error('Invalid payment method:', forma_pagamento);
      throw new Error('Forma de pagamento é obrigatória');
    }
    
    const numericTotal = Number(valor_total);
    if (!numericTotal || numericTotal <= 0) {
      console.error('Invalid total value:', valor_total);
      throw new Error('Valor total do pedido deve ser maior que zero');
    }

    // Validate items structure
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.produto_id || !item.quantidade || !item.preco_unitario) {
        console.error(`Invalid item at index ${i}:`, item);
        throw new Error(`Item ${i + 1} possui dados inválidos (produto_id, quantidade e preco_unitario são obrigatórios)`);
      }
      
      if (Number(item.quantidade) <= 0 || Number(item.preco_unitario) <= 0) {
        console.error(`Invalid item values at index ${i}:`, item);
        throw new Error(`Item ${i + 1} possui quantidade ou preço inválido`);
      }
    }

    console.log('All validations passed, creating order...');

    let orderId;
    let inventoryUpdated = true;
    let pointsRegistered = true;
    let couponProcessed = true;

    // Create the order using service client
    const { data: orderData, error: orderError } = await serviceClient
      .from('orders')
      .insert([{
        cliente_id: user.id,
        endereco_entrega,
        forma_pagamento,
        valor_total: numericTotal,
        pontos_ganhos: Number(pontos_ganhos) || 0,
        status: status || 'Confirmado',
        cupom_codigo: cupom_aplicado?.code || null,
        desconto_aplicado: Number(desconto) || 0
      }])
      .select('id')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error(`Falha ao criar pedido: ${orderError.message}`);
    }

    orderId = orderData.id;
    console.log('Order created successfully with ID:', orderId);

    // Create order items and update inventory
    for (const item of items) {
      try {
        // Create order item
        const { error: itemError } = await serviceClient
          .from('order_items')
          .insert([{
            order_id: orderId,
            produto_id: item.produto_id,
            quantidade: Number(item.quantidade),
            preco_unitario: Number(item.preco_unitario),
            subtotal: Number(item.subtotal) || (Number(item.preco_unitario) * Number(item.quantidade)),
            pontos: Number(item.pontos) || 0
          }]);

        if (itemError) {
          console.error('Error creating order item:', itemError);
          throw new Error(`Falha ao criar item do pedido: ${itemError.message}`);
        }

        // Update product inventory using raw SQL to avoid conflicts
        const { error: updateError } = await serviceClient
          .rpc('update_inventory_on_order', {
            p_produto_id: item.produto_id,
            p_quantidade: Number(item.quantidade)
          });

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
    const pointsValue = Number(pontos_ganhos) || 0;
    if (pointsValue > 0) {
      try {
        const { error: pointsError } = await serviceClient
          .from('points_transactions')
          .insert([{
            user_id: user.id,
            pontos: pointsValue,
            tipo: 'compra',
            descricao: `Pontos por compra #${orderId}`,
            referencia_id: orderId
          }]);

        if (pointsError) {
          console.error('Error registering points:', pointsError);
          pointsRegistered = false;
        } else {
          // Update user total points using RPC function
          const { error: updatePointsError } = await serviceClient
            .rpc('update_user_points', {
              user_id: user.id,
              points_to_add: pointsValue
            });

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
    const discountValue = Number(desconto) || 0;
    if (cupom_aplicado && cupom_aplicado.code && discountValue > 0) {
      try {
        // For now, we'll just log the coupon processing since we need the coupon ID
        console.log('Processing coupon:', cupom_aplicado.code, 'with discount:', discountValue);
        // TODO: Implement proper coupon processing when we have the coupon system ready
        couponProcessed = true;
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
        error: error.message || 'Falha ao criar pedido' 
      }),
      { status: 400, headers: corsHeaders }
    );
  }
}

// Stock validation function
async function handleStockValidation(serviceClient: any, items: any[]) {
  try {
    console.log('Validating stock for', items.length, 'items');
    
    const failedItems: string[] = [];
    
    for (const item of items) {
      const { data: product, error: stockError } = await serviceClient
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
