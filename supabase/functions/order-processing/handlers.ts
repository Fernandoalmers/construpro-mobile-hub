
import { corsHeaders, initSupabaseClient, verifyUserToken } from './utils.ts'
import { Order } from './types.ts'

// Helper function to capitalize the first letter of order status
function capitalizeOrderStatus(status: string): string {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export async function handleGetOrders(req: Request, authHeader: string) {
  try {
    console.log("Getting orders for authenticated user");
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = initSupabaseClient(token)
    const user = await verifyUserToken(supabaseClient)
    
    console.log(`User authenticated successfully: ${user.id}`);
    
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*, order_items(*, produtos:produto_id(*))')
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
      .select('*, order_items(*, produtos:produto_id(*))')
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
    
    // First verify the user with the regular client
    const regularClient = initSupabaseClient(token)
    const user = await verifyUserToken(regularClient)
    console.log(`User authenticated successfully: ${user.id}`);
    
    // For database operations that might face RLS issues, use the service role client
    // The service role bypasses RLS policies entirely
    const serviceRoleClient = initSupabaseClient(token, true)
    
    const orderData: Order = await req.json()
    console.log("Processing order data:", JSON.stringify(orderData));
    
    // Properly capitalize the status field to match database constraint
    if (orderData.status) {
      orderData.status = capitalizeOrderStatus(orderData.status);
    } else {
      // Default status if none provided
      orderData.status = "Confirmado";
    }
    
    // Calculate points earned (10% of order total)
    const pontos_ganhos = Math.floor(orderData.valor_total * 0.1)
    
    // IMPORTANT: Removing custom transaction functions as they are causing errors
    // We'll use individual operations instead
    
    try {
      console.log(`Creating order for user: ${user.id}`);
      
      // Create order with explicit user ID to satisfy RLS (but using service role to bypass RLS)
      console.log("Inserting order record");
      const orderInsertData = {
        cliente_id: user.id,
        valor_total: orderData.valor_total,
        pontos_ganhos: pontos_ganhos,
        status: orderData.status,
        forma_pagamento: orderData.forma_pagamento,
        rastreio: orderData.rastreio,
        endereco_entrega: orderData.endereco_entrega,
      };
      
      console.log("Order insert data:", JSON.stringify(orderInsertData));
      
      const { data: order, error: orderError } = await serviceRoleClient
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();
      
      if (orderError) {
        console.error("Order creation error:", orderError);
        
        // Enhanced error logging
        console.error("Error code:", orderError.code);
        console.error("Error details:", orderError.details);
        console.error("Error hint:", orderError.hint);
        
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
      
      const { error: itemsError } = await serviceRoleClient
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error("Order items error:", itemsError);
        throw new Error(`Order items error: ${itemsError.message}`);
      }
      
      console.log("Order items created successfully");
      
      // Add points transaction
      console.log("Creating points transaction");
      const { error: pointsError } = await serviceRoleClient
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
      const { error: profileError } = await serviceRoleClient
        .rpc('update_user_points', { 
          user_id: user.id, 
          points_to_add: pontos_ganhos 
        });
      
      if (profileError) {
        console.error("Update points error:", profileError);
        throw new Error(`Update points error: ${profileError.message}`);
      }
      
      console.log("User points updated successfully");
      
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
