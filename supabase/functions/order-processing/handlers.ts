
import { corsHeaders } from './utils.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OrderData, OrderItem, OrderResponse } from './types.ts';

// Helper function to get the Supabase client
const getSupabaseClient = (authHeader: string, admin = false) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = admin 
    ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    : Deno.env.get('SUPABASE_ANON_KEY') || '';
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: admin ? {} : { Authorization: authHeader }
    }
  });
};

// New function to check and process referrals
async function processReferralsForFirstOrder(
  userId: string, 
  orderTotal: number,
  authHeader: string
): Promise<boolean> {
  try {
    console.log(`Checking referrals for user: ${userId} with order total: ${orderTotal}`);
    
    // Skip if order value is too low
    if (orderTotal < 10) {
      console.log("Order total too low for referral processing");
      return false;
    }
    
    // Get admin client to check and update referrals
    const adminClient = getSupabaseClient(authHeader, true);
    
    // Check if this is the user's first order
    const { data: previousOrders, error: orderCheckError } = await adminClient
      .from('orders')
      .select('id')
      .eq('cliente_id', userId)
      .limit(2);
    
    if (orderCheckError) {
      console.error("Error checking previous orders:", orderCheckError);
      return false;
    }
    
    // If user has more than this current order, not their first order
    if (previousOrders && previousOrders.length > 1) {
      console.log("Not user's first order, skipping referral processing");
      return false;
    }
    
    // Find pending referral where this user was referred
    const { data: pendingReferral, error: referralError } = await adminClient
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pendente')
      .maybeSingle();
    
    if (referralError) {
      console.error("Error checking pending referrals:", referralError);
      return false;
    }
    
    // If no pending referral found, nothing to process
    if (!pendingReferral) {
      console.log("No pending referrals found for this user");
      return false;
    }
    
    console.log("Found pending referral:", pendingReferral);
    
    // Update referral status to approved
    const { error: updateError } = await adminClient
      .from('referrals')
      .update({ 
        status: 'aprovado',
        pontos: 50, // Set to 50 points
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingReferral.id);
    
    if (updateError) {
      console.error("Error updating referral status:", updateError);
      return false;
    }
    
    // Award points to referrer
    const { error: referrerPointsError } = await adminClient.rpc(
      'update_user_points',
      { 
        user_id: pendingReferral.referrer_id, 
        points_to_add: 50
      }
    );
    
    if (referrerPointsError) {
      console.error("Error awarding points to referrer:", referrerPointsError);
      return false;
    }
    
    // Log transaction for referrer
    const { error: referrerTxError } = await adminClient
      .from('points_transactions')
      .insert({
        user_id: pendingReferral.referrer_id,
        pontos: 50,
        tipo: 'indicacao',
        referencia_id: pendingReferral.id,
        descricao: 'Pontos por indicação aprovada'
      });
    
    if (referrerTxError) {
      console.error("Error logging referrer transaction:", referrerTxError);
      return false;
    }
    
    // Award points to referred user (this user)
    const { error: referredPointsError } = await adminClient.rpc(
      'update_user_points',
      { 
        user_id: userId, 
        points_to_add: 50
      }
    );
    
    if (referredPointsError) {
      console.error("Error awarding points to referred user:", referredPointsError);
      return false;
    }
    
    // Log transaction for referred user
    const { error: referredTxError } = await adminClient
      .from('points_transactions')
      .insert({
        user_id: userId,
        pontos: 50,
        tipo: 'indicacao',
        referencia_id: pendingReferral.id,
        descricao: 'Pontos por usar código de indicação'
      });
    
    if (referredTxError) {
      console.error("Error logging referred user transaction:", referredTxError);
      return false;
    }
    
    console.log("Successfully processed referral!");
    return true;
  } catch (error) {
    console.error("Error processing referrals:", error);
    return false;
  }
}

// New function to process coupon usage
async function processCouponUsage(
  orderId: string,
  userId: string,
  couponData: any,
  discountAmount: number,
  authHeader: string
): Promise<boolean> {
  try {
    const adminClient = getSupabaseClient(authHeader, true);
    
    console.log('Processing coupon usage:', {
      orderId,
      userId,
      couponCode: couponData?.code,
      discountAmount
    });

    if (!couponData?.code) {
      console.log('No coupon to process');
      return true; // Not an error, just no coupon
    }

    // Find the coupon by code
    const { data: coupon, error: couponError } = await adminClient
      .from('coupons')
      .select('id')
      .eq('code', couponData.code.toUpperCase())
      .single();

    if (couponError || !coupon) {
      console.error('Error finding coupon:', couponError);
      return false;
    }

    // Register coupon usage
    const { error: usageError } = await adminClient
      .from('coupon_usage')
      .insert({
        coupon_id: coupon.id,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
        used_at: new Date().toISOString()
      });

    if (usageError) {
      console.error('Error registering coupon usage:', usageError);
      return false;
    }

    // Update coupon used_count
    const { error: updateError } = await adminClient
      .from('coupons')
      .update({ 
        used_count: adminClient.raw('used_count + 1')
      })
      .eq('id', coupon.id);

    if (updateError) {
      console.error('Error updating coupon used_count:', updateError);
      return false;
    }

    console.log('Successfully processed coupon usage');
    return true;
  } catch (error) {
    console.error('Error processing coupon usage:', error);
    return false;
  }
}

// Handle GET request to retrieve all orders for the authenticated user
export async function handleGetOrders(req: Request, authHeader: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient(authHeader);
    
    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication error' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const userId = userData.user.id;
    
    // Get all orders for this user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: ordersError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        orders: orders || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Unexpected error in handleGetOrders:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle GET request to retrieve a specific order by ID
export async function handleGetOrderById(req: Request, authHeader: string, orderId: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient(authHeader);
    
    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication error' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const userId = userData.user.id;
    
    // Get the specific order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .eq('cliente_id', userId)
      .single();
    
    if (orderError) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: orderError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found or access denied' 
        }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        order
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Unexpected error in handleGetOrderById:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle POST request to create a new order
export async function handleCreateOrder(req: Request, authHeader: string): Promise<Response> {
  try {
    const supabase = getSupabaseClient(authHeader);
    const adminClient = getSupabaseClient(authHeader, true);
    
    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication error' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const userId = userData.user.id;
    
    // Parse request body
    const requestData = await req.json();
    console.log("Order creation data:", requestData);
    
    // Validate required fields
    if (!requestData.items || !Array.isArray(requestData.items) || requestData.items.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order items are required' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!requestData.endereco_entrega) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Delivery address is required' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Calculate total if not provided
    if (!requestData.valor_total) {
      requestData.valor_total = requestData.items.reduce(
        (sum: number, item: OrderItem) => sum + (item.subtotal || (item.preco_unitario * item.quantidade)),
        0
      );
    }
    
    // Prepare order data
    const orderData: OrderData = {
      cliente_id: userId,
      status: requestData.status || 'Confirmado',
      forma_pagamento: requestData.forma_pagamento || 'Cartão de Crédito',
      endereco_entrega: requestData.endereco_entrega,
      valor_total: requestData.valor_total,
      pontos_ganhos: requestData.pontos_ganhos || Math.round(requestData.valor_total * 2) // Default to 2x points
    };
    
    // Start a transaction
    // Note: Since Supabase JS client doesn't support transactions directly yet,
    // we'll do the operations sequentially and handle errors
    
    let orderResult;
    let couponProcessed = true;
    try {
      // 1. Create the order
      const { data: order, error: orderError } = await adminClient
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) throw orderError;
      orderResult = order;
      
      // 2. Create order items
      const orderItems = requestData.items.map((item: OrderItem) => ({
        order_id: order.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal || (item.preco_unitario * item.quantidade)
      }));
      
      const { error: itemsError } = await adminClient
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // 3. Process coupon usage if coupon was applied
      if (requestData.cupom_aplicado && requestData.desconto > 0) {
        couponProcessed = await processCouponUsage(
          order.id,
          userId,
          requestData.cupom_aplicado,
          requestData.desconto,
          authHeader
        );
      }
      
      // 4. Process referral if this is user's first order
      await processReferralsForFirstOrder(userId, orderData.valor_total, authHeader);
      
    } catch (txError: any) {
      console.error("Transaction error:", txError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: txError.message || 'Error creating order' 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Return success with the created order
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order created successfully',
        order: orderResult,
        inventoryUpdated: true,
        pointsRegistered: true,
        couponProcessed
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Unexpected error in handleCreateOrder:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
