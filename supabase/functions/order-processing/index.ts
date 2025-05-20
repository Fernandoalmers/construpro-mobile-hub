import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-order-id, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  console.log(`Order processing function called: ${req.method} ${req.url}`);

  try {
    // Parse request URL and method
    const url = new URL(req.url);
    const method = req.method;
    
    // Get order ID from URL search params or headers
    let orderId = url.searchParams.get('id');
    
    // If not in URL params, try to get it from custom header
    if (!orderId) {
      orderId = req.headers.get('x-order-id');
      console.log(`Getting order ID from header: ${orderId}`);
    }
    
    // Log the request details
    console.log(`Request parsed: Method=${method}, OrderId=${orderId || 'none'}`);
    
    // Authenticate user - who's making the request
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header missing or invalid'
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Error authenticating user:', authError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication failed'
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`User authenticated successfully: ${user.id}`);

    // Handle GET request for order details
    if (method === 'GET') {
      
      if (!orderId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Order ID is required'
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      console.log(`Fetching order details for ID: ${orderId}`);
      
      // Fetch order data using service role (bypasses RLS)
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          cliente_id,
          valor_total,
          pontos_ganhos,
          status,
          forma_pagamento,
          endereco_entrega,
          created_at,
          updated_at,
          rastreio
        `)
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('Error fetching order:', orderError);
        return new Response(JSON.stringify({
          success: false,
          error: orderError.message
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (!orderData) {
        console.log(`No order found with ID: ${orderId}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Pedido não encontrado'
        }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Verify the user is authorized to view this order
      if (orderData.cliente_id !== user.id) {
        console.error(`User ${user.id} is not authorized to view order ${orderId} belonging to ${orderData.cliente_id}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Você não tem permissão para ver este pedido'
        }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Fetch order items with improved logging
      console.log(`Now fetching items for order: ${orderId}`);
      const { data: orderItems, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          order_id
        `)
        .eq('order_id', orderId);
      
      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
      }
      
      console.log(`Found ${orderItems?.length || 0} items for order ${orderId}`);
      
      // Fetch product details for items
      let itemsWithProducts = [];
      
      if (orderItems && orderItems.length > 0) {
        // Get product details
        const productIds = orderItems.map(item => item.produto_id);
        
        console.log(`Fetching product details for ${productIds.length} products`);
        
        const { data: products, error: productsError } = await supabaseAdmin
          .from('produtos')
          .select('id, nome, imagens, preco_normal, preco_promocional, descricao, categoria')
          .in('id', productIds);
          
        if (productsError) {
          console.error('Error fetching products:', productsError);
        }
        
        // Create products lookup map
        const productsMap: { [key: string]: any } = {};
        if (products) {
          products.forEach(product => {
            productsMap[product.id] = product;
          });
          console.log(`Created product map with ${products.length} products`);
        }
        
        // Merge items with their product data
        itemsWithProducts = orderItems.map(item => {
          const productData = productsMap[item.produto_id] || null;
          
          // Extract image URL from product data if available
          let imageUrl = null;
          if (productData && productData.imagens && Array.isArray(productData.imagens) && productData.imagens.length > 0) {
            const firstImage = productData.imagens[0];
            if (typeof firstImage === 'string') {
              imageUrl = firstImage;
            } else if (firstImage && typeof firstImage === 'object') {
              imageUrl = firstImage.url || firstImage.path || null;
            }
          }
          
          return {
            ...item,
            produto: productData ? {
              ...productData,
              imagem_url: imageUrl
            } : {
              nome: 'Produto não disponível',
              preco_normal: item.preco_unitario,
              imagem_url: null
            }
          };
        });
      }
      
      // Combine order with items
      const orderWithItems = {
        ...orderData,
        items: itemsWithProducts || []
      };
      
      console.log(`✅ Sending complete order response for ID ${orderId}`);
      
      return new Response(JSON.stringify({
        success: true,
        order: orderWithItems
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Handle POST request to create an order
    if (method === 'POST') {
      console.log("Handling POST request to create new order");
      
      // Determine user type for proper rewards calculation
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('tipo_perfil')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return new Response(JSON.stringify({
          success: false, 
          error: 'Failed to fetch user profile'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      const userType = profileData.tipo_perfil || 'consumidor';
      console.log(`User type determined as: ${userType}`);
      
      // Parse the request body
      let orderData;
      try {
        orderData = await req.json();
        console.log(`Processing order data:`, JSON.stringify(orderData));
      } catch (err) {
        console.error('Error parsing request body:', err);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to parse request body'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      
      console.log('Creating order for user:', user.id);
      
      // Use points provided from frontend or calculate from items
      let totalPoints = orderData.pontos_ganhos;
      console.log(`Using points provided from frontend: ${totalPoints}`);

      // Calculate points for debug purposes
      console.log(`Calculating points for order items with user type: ${userType}`);
      let calculatedPoints = 0;
      if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach((item: any) => {
          calculatedPoints += (item.pontos || 0) * item.quantidade;
        });
      }
      console.log(`Total points calculated for order: ${calculatedPoints}`);
      
      // Insert the order record
      console.log('Inserting order record with points:', totalPoints);
      const orderInsertData = {
        cliente_id: user.id,
        valor_total: orderData.valor_total,
        pontos_ganhos: totalPoints,
        status: orderData.status || 'Confirmado',
        forma_pagamento: orderData.forma_pagamento,
        endereco_entrega: orderData.endereco_entrega
      };
      
      console.log('Order insert data:', JSON.stringify(orderInsertData));
      const { data: newOrder, error: orderInsertError } = await supabaseAdmin
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();
      
      if (orderInsertError) {
        console.error('Error creating order:', orderInsertError);
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to create order: ${orderInsertError.message}`
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      console.log(`Order created successfully: ${newOrder.id}`);
      
      // Create order items
      console.log('Creating order items');
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        console.error('No valid items in order data');
        return new Response(JSON.stringify({
          success: false,
          error: 'No valid items in order data'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      
      const orderItems = orderData.items.map((item: any) => ({
        order_id: newOrder.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }));
      
      const { data: itemsData, error: itemsInsertError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);
      
      if (itemsInsertError) {
        console.error('Error creating order items:', itemsInsertError);
        // Order was created, but items failed
        return new Response(JSON.stringify({
          success: true,
          warning: 'Order created but some items may not have been processed',
          order: newOrder
        }), { headers: { 'Content-Type': 'application/json' } });
      }
      
      console.log('Order items created successfully');
      
      // Update product inventory
      console.log('Updating product inventory for order items:', JSON.stringify(orderData.items));
      for (const item of orderData.items) {
        // Get current stock
        const { data: productData, error: productError } = await supabaseAdmin
          .from('produtos')
          .select('estoque')
          .eq('id', item.produto_id)
          .single();
          
        if (productError) {
          console.error(`Error fetching product ${item.produto_id}:`, productError);
          continue; // Skip this item
        }
        
        // Calculate new stock
        const newStock = productData.estoque - item.quantidade;
        console.log(`Updating product ${item.produto_id} stock: ${productData.estoque} -> ${newStock}`);
        
        // Update stock
        const { error: updateError } = await supabaseAdmin
          .from('produtos')
          .update({ estoque: newStock })
          .eq('id', item.produto_id);
          
        if (updateError) {
          console.error(`Error updating product ${item.produto_id} stock:`, updateError);
        }
      }
      
      console.log('Product inventory updated successfully');
      
      // Create points transaction
      console.log(`Creating points transaction with points: ${totalPoints}`);
      if (totalPoints > 0) {
        const { error: pointsError } = await supabaseAdmin
          .from('points_transactions')
          .insert({
            user_id: user.id,
            pontos: totalPoints,
            referencia_id: newOrder.id,
            tipo: 'compra', // Changed from 'credito' to 'compra' to match DB constraints
            descricao: `Pontos ganhos na compra #${newOrder.id.substring(0,8)}`
          });
          
        if (pointsError) {
          console.error('Error creating points transaction:', pointsError);
          console.error('Error code:', pointsError.code);
          console.error('Error details:', pointsError.details);
          console.error('Error message:', pointsError.message);
          
          // Continue with the order even if points transaction fails
          // We'll just log the error but not fail the entire order
          // This ensures the order is created even if points cannot be added
        } else {
          console.log('Points transaction created successfully');
        }
        
        // Update user points balance
        console.log('Updating user points balance');
        const { error: updatePointsError } = await supabaseAdmin
          .rpc('update_user_points', {
            user_id: user.id,
            points_to_add: totalPoints
          });
          
        if (updatePointsError) {
          console.error('Error updating user points:', updatePointsError);
        } else {
          console.log('User points updated successfully');
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        order: newOrder
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    // Handle unsupported methods
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not supported'
    }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (err) {
    console.error('Unhandled error in order processing:', err);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: err.message
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
