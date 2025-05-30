
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
    console.log('Request URL:', req.url);
    
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

    console.log('Reading request body...');
    
    let requestBody;
    
    try {
      // Use req.json() directly for better reliability
      requestBody = await req.json();
      console.log('Successfully parsed request body');
      console.log('Body keys:', Object.keys(requestBody || {}));
      console.log('Body content:', JSON.stringify(requestBody, null, 2));
      
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
    
    // Validate that we have a body
    if (!requestBody || typeof requestBody !== 'object') {
      console.error('Request body is missing or invalid:', requestBody);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Request body is required and must be a valid JSON object' 
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
        error: 'Invalid action specified. Expected: validate_stock or create_order' 
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

// Handle order creation with improved inventory management
async function handleOrderCreation(serviceClient: any, user: any, body: any) {
  try {
    console.log('🛒 Processing order creation for user:', user.id);
    console.log('📦 Order body received:', JSON.stringify(body, null, 2));
    
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
      console.error('❌ Invalid items:', items);
      throw new Error('Itens do pedido são obrigatórios e devem ser uma lista válida');
    }
    
    console.log(`📦 Items validation: ${items.length} items received`);
    
    if (!endereco_entrega || typeof endereco_entrega !== 'object') {
      console.error('❌ Invalid address:', endereco_entrega);
      throw new Error('Endereço de entrega é obrigatório');
    }
    
    // Validate address fields
    const requiredAddressFields = ['rua', 'cidade', 'estado', 'cep'];
    const missingFields = requiredAddressFields.filter(field => !endereco_entrega[field]);
    if (missingFields.length > 0) {
      console.error('❌ Missing address fields:', missingFields);
      console.error('Address received:', endereco_entrega);
      throw new Error(`Campos obrigatórios do endereço ausentes: ${missingFields.join(', ')}`);
    }
    
    if (!forma_pagamento) {
      console.error('❌ Invalid payment method:', forma_pagamento);
      throw new Error('Forma de pagamento é obrigatória');
    }
    
    const numericTotal = Number(valor_total);
    if (!numericTotal || numericTotal <= 0) {
      console.error('❌ Invalid total value:', valor_total);
      throw new Error('Valor total do pedido deve ser maior que zero');
    }

    // Validate items structure and check stock before creating order
    console.log('🔍 Validating items and checking stock...');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📋 Validating item ${i + 1}:`, item);
      
      if (!item.produto_id || !item.quantidade || !item.preco_unitario) {
        console.error(`❌ Invalid item at index ${i}:`, item);
        throw new Error(`Item ${i + 1} possui dados inválidos (produto_id, quantidade e preco_unitario são obrigatórios)`);
      }
      
      if (Number(item.quantidade) <= 0 || Number(item.preco_unitario) <= 0) {
        console.error(`❌ Invalid item values at index ${i}:`, item);
        throw new Error(`Item ${i + 1} possui quantidade ou preço inválido`);
      }

      // Check stock availability using the new function
      console.log(`🔍 Checking stock for product ${item.produto_id}, quantity: ${item.quantidade}`);
      const { data: stockCheck, error: stockError } = await serviceClient
        .rpc('check_product_stock', {
          p_produto_id: item.produto_id,
          p_quantidade: Number(item.quantidade)
        });

      if (stockError) {
        console.error(`❌ Error checking stock for product ${item.produto_id}:`, stockError);
        throw new Error(`Erro ao verificar estoque do produto ${i + 1}`);
      }

      if (!stockCheck) {
        console.error(`❌ Insufficient stock for product ${item.produto_id}`);
        // Get current stock for error message
        const { data: productData } = await serviceClient
          .from('produtos')
          .select('nome, estoque')
          .eq('id', item.produto_id)
          .single();
        
        const productName = productData?.nome || 'Produto';
        const currentStock = productData?.estoque || 0;
        throw new Error(`Estoque insuficiente para ${productName}. Disponível: ${currentStock}, Solicitado: ${item.quantidade}`);
      }
    }

    console.log('✅ All stock validations passed, creating order...');

    let orderId;
    let inventoryUpdated = true;
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
      console.error('❌ Error creating order:', orderError);
      throw new Error(`Falha ao criar pedido: ${orderError.message}`);
    }

    orderId = orderData.id;
    console.log('✅ Order created successfully with ID:', orderId);

    // Create order items - inventory will be updated automatically by trigger
    console.log(`📦 Creating ${items.length} order items...`);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📋 Processing item ${i + 1}/${items.length}:`, {
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal || (Number(item.preco_unitario) * Number(item.quantidade))
      });
      
      try {
        // Create order item - trigger will automatically update inventory
        const { error: itemError } = await serviceClient
          .from('order_items')
          .insert([{
            order_id: orderId,
            produto_id: item.produto_id,
            quantidade: Number(item.quantidade),
            preco_unitario: Number(item.preco_unitario),
            subtotal: Number(item.subtotal) || (Number(item.preco_unitario) * Number(item.quantidade))
          }]);

        if (itemError) {
          console.error('❌ Error creating order item:', itemError);
          // Try manual inventory update as fallback
          console.log('⚠️ Attempting manual inventory update as fallback...');
          const { error: manualUpdateError } = await serviceClient
            .rpc('update_inventory_on_order', {
              p_produto_id: item.produto_id,
              p_quantidade: Number(item.quantidade)
            });

          if (manualUpdateError) {
            console.error('❌ Manual inventory update failed:', manualUpdateError);
            inventoryUpdated = false;
          } else {
            console.log('✅ Manual inventory update successful');
          }
          
          throw new Error(`Falha ao criar item do pedido: ${itemError.message}`);
        }
        
        console.log(`✅ Item ${i + 1} created successfully (inventory updated by trigger)`);

      } catch (itemError) {
        console.error('❌ Error processing item:', itemError);
        inventoryUpdated = false;
        throw itemError; // Re-throw to abort the order
      }
    }

    console.log(`✅ All ${items.length} items processed`);

    // REMOVED: Manual points registration - let the trigger handle it automatically
    // The register_points_on_order() trigger will handle points registration
    console.log('📊 Points will be registered automatically by trigger');

    // Process coupon if applicable
    const discountValue = Number(desconto) || 0;
    if (cupom_aplicado && cupom_aplicado.code && discountValue > 0) {
      try {
        console.log('💳 Processing coupon:', cupom_aplicado.code, 'with discount:', discountValue);
        // TODO: Implement proper coupon processing when we have the coupon system ready
        couponProcessed = true;
      } catch (couponError) {
        console.error('❌ Coupon processing error:', couponError);
        couponProcessed = false;
      }
    }

    console.log('✅ Order processing completed successfully');
    return new Response(
      JSON.stringify({
        success: true,
        order: { id: orderId },
        inventoryUpdated,
        pointsRegistered: true, // Always true since trigger handles it
        couponProcessed
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Order creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Falha ao criar pedido' 
      }),
      { status: 400, headers: corsHeaders }
    );
  }
}

// Enhanced stock validation function
async function handleStockValidation(serviceClient: any, items: any[]) {
  try {
    console.log('🔍 Validating stock for', items.length, 'items');
    
    const invalidItems: any[] = [];
    const adjustedItems: any[] = [];
    
    for (const item of items) {
      console.log('🔍 Checking stock for product:', item.produto_id, 'quantity:', item.quantidade);
      
      const { data: product, error: stockError } = await serviceClient
        .from('produtos')
        .select('id, nome, estoque')
        .eq('id', item.produto_id)
        .single();
        
      if (stockError || !product) {
        console.error('❌ Product not found:', item.produto_id);
        invalidItems.push({
          itemId: item.produto_id,
          productName: 'Produto não encontrado',
          requestedQuantity: item.quantidade,
          availableStock: 0
        });
        continue;
      }
      
      if (product.estoque < item.quantidade) {
        console.warn('⚠️ Insufficient stock for product:', product.nome, 'Available:', product.estoque, 'Requested:', item.quantidade);
        
        if (product.estoque === 0) {
          // No stock available
          invalidItems.push({
            itemId: item.produto_id,
            productName: product.nome,
            requestedQuantity: item.quantidade,
            availableStock: product.estoque
          });
        } else {
          // Some stock available, but less than requested
          adjustedItems.push({
            itemId: item.produto_id,
            productName: product.nome,
            oldQuantity: item.quantidade,
            newQuantity: product.estoque
          });
        }
      } else {
        console.log('✅ Stock OK for product:', product.nome);
      }
    }
    
    const isValid = invalidItems.length === 0 && adjustedItems.length === 0;
    
    return new Response(
      JSON.stringify({
        success: true,
        isValid,
        invalidItems,
        adjustedItems
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('❌ Stock validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Stock validation failed: ' + error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
