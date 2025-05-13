
import { corsHeaders, initSupabaseClient, verifyUserToken } from './utils.ts'
import { Order } from './types.ts'

export async function handleGetOrders(req: Request, authHeader: string) {
  try {
    console.log("Getting orders for authenticated user");
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = initSupabaseClient(token)
    const user = await verifyUserToken(supabaseClient)
    
    console.log(`User authenticated successfully: ${user.id}`);
    
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*, produtos:product_id(*))')
      .eq('cliente_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error("Error fetching orders:", error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message 
        }),
        { status: 500, headers: corsHeaders }
      )
    }
    
    console.log(`Retrieved ${orders?.length || 0} orders for user ${user.id}`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        orders 
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("Authorization error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error fetching orders' 
      }),
      { status: 401, headers: corsHeaders }
    )
  }
}

export async function handleGetOrderById(req: Request, authHeader: string, orderId: string) {
  try {
    console.log(`Getting order details for ID: ${orderId}`);
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = initSupabaseClient(token)
    const user = await verifyUserToken(supabaseClient)
    
    console.log(`User authenticated successfully: ${user.id}`);
    
    const { data: order, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*, produtos:product_id(*))')
      .eq('id', orderId)
      .eq('cliente_id', user.id)
      .single()
    
    if (error) {
      console.error("Error fetching order by ID:", error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message 
        }),
        { status: error.code === 'PGRST116' ? 404 : 500, headers: corsHeaders }
      )
    }
    
    console.log(`Retrieved order ${order.id} successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        order 
      }),
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    console.error("Authorization error on get order by ID:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error fetching order' 
      }),
      { status: 401, headers: corsHeaders }
    )
  }
}

export async function handleCreateOrder(req: Request, authHeader: string) {
  try {
    console.log("Starting order creation process");
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = initSupabaseClient(token)
    const user = await verifyUserToken(supabaseClient)
    
    console.log(`User authenticated successfully: ${user.id}`);
    
    const orderData: Order = await req.json()
    console.log("Processing order data:", JSON.stringify(orderData));
    
    // Calculate points earned (10% of order total)
    const pontos_ganhos = Math.floor(orderData.valor_total * 0.1)
    
    // Try to use a transaction, but fallback to individual operations if transaction functions aren't working
    let useTransactions = true;
    try {
      console.log("Testing transaction support");
      // Check if transaction functions exist by calling one
      const { error: testTxError } = await supabaseClient.rpc('begin_transaction');
      if (testTxError) {
        console.error("Transaction functions not working, fallback to direct operations:", testTxError);
        useTransactions = false;
      } else {
        console.log("Transaction support confirmed");
      }
    } catch (error) {
      console.error("Error testing transaction functions:", error);
      useTransactions = false;
    }
    
    // Start creating the order
    try {
      // Begin transaction if available
      if (useTransactions) {
        console.log("Beginning transaction");
        const { error: txBeginError } = await supabaseClient.rpc('begin_transaction');
        if (txBeginError) {
          console.error("Transaction begin error:", txBeginError);
          throw new Error(`Transaction begin error: ${txBeginError.message}`);
        }
        console.log("Transaction started successfully");
      }
      
      console.log(`Creating order for user: ${user.id}`);
      
      // Create order with explicit user ID to satisfy RLS
      console.log("Inserting order record");
      const orderInsertData = {
        cliente_id: user.id,
        valor_total: orderData.valor_total,
        pontos_ganhos: pontos_ganhos,
        status: orderData.status || 'Em Separação',
        forma_pagamento: orderData.forma_pagamento,
        rastreio: orderData.rastreio,
        endereco_entrega: orderData.endereco_entrega,
      };
      
      console.log("Order insert data:", JSON.stringify(orderInsertData));
      
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();
      
      if (orderError) {
        console.error("Order creation error:", orderError);
        
        // Check if this is an RLS policy violation
        if (orderError.message.includes('row-level security policy')) {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro de permissão: Você não tem autorização para criar pedidos.',
              details: orderError.message,
              code: 'RLS_VIOLATION'
            }),
            { status: 403, headers: corsHeaders }
          );
        }
        
        throw new Error(`Order creation error: ${orderError.message}`);
      }
      
      console.log("Order created successfully:", order?.id);
      
      // Create order items
      console.log("Creating order items");
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      }));
      
      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw new Error(`Order items error: ${itemsError.message}`);
      }
      
      console.log("Order items created successfully");
      
      // Add points transaction
      console.log("Creating points transaction");
      const { error: pointsError } = await supabaseClient
        .from('points_transactions')
        .insert({
          user_id: user.id,
          pontos: pontos_ganhos,
          tipo: 'compra',
          referencia_id: order.id,
          descricao: `Pontos ganhos na compra #${order.id.substring(0,8)}`
        });
      
      if (pointsError) {
        console.error("Points transaction error:", pointsError);
        throw new Error(`Points transaction error: ${pointsError.message}`);
      }
      
      console.log("Points transaction created successfully");
      
      // Update user points balance
      console.log("Updating user points balance");
      const { error: profileError } = await supabaseClient
        .rpc('update_user_points', { 
          user_id: user.id, 
          points_to_add: pontos_ganhos 
        });
      
      if (profileError) {
        console.error("Update points error:", profileError);
        throw new Error(`Update points error: ${profileError.message}`);
      }
      
      console.log("User points updated successfully");
      
      // Commit transaction if we're using them
      if (useTransactions) {
        console.log("Committing transaction");
        const { error: commitError } = await supabaseClient.rpc('commit_transaction');
        if (commitError) {
          console.error("Transaction commit error:", commitError);
          throw new Error(`Transaction commit error: ${commitError.message}`);
        }
        console.log("Transaction committed successfully");
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          order: {
            ...order,
            items: orderData.items
          }
        }),
        { status: 201, headers: corsHeaders }
      );
    } catch (error: any) {
      console.error("Order creation error:", error);
      
      // Rollback transaction if we're using them
      if (useTransactions) {
        try {
          console.log("Rolling back transaction");
          await supabaseClient.rpc('rollback_transaction');
          console.log("Transaction rolled back");
        } catch (rollbackError) {
          console.error("Rollback error:", rollbackError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message || 'Erro ao processar pedido',
          details: error.toString(),
          code: error.code || 'PROCESSING_ERROR'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error("Authorization error on create order:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Error processing order',
        details: error.toString(),
        code: 'AUTH_ERROR'
      }),
      { status: 401, headers: corsHeaders }
    )
  }
}
