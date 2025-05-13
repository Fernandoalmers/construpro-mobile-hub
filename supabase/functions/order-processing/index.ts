
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
}

interface OrderItem {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface Order {
  id?: string;
  valor_total: number;
  forma_pagamento: string;
  endereco_entrega: Record<string, any>;
  status?: string;
  rastreio?: string;
  items: OrderItem[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: authError?.message || 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }
    
    // Process request based on method
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    const orderId = path[path.length - 1] !== 'order-processing' ? path[path.length - 1] : null

    // GET /order-processing - List user's orders
    if (req.method === 'GET' && !orderId) {
      const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('*, order_items(*, produtos:product_id(*))')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: corsHeaders }
        )
      }
      
      return new Response(
        JSON.stringify({ orders }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // GET /order-processing/:id - Get specific order
    if (req.method === 'GET' && orderId) {
      const { data: order, error } = await supabaseClient
        .from('orders')
        .select('*, order_items(*, produtos:product_id(*))')
        .eq('id', orderId)
        .eq('cliente_id', user.id)
        .single()
      
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: error.code === 'PGRST116' ? 404 : 500, headers: corsHeaders }
        )
      }
      
      return new Response(
        JSON.stringify({ order }),
        { status: 200, headers: corsHeaders }
      )
    }
    
    // POST /order-processing - Create a new order
    if (req.method === 'POST') {
      const orderData: Order = await req.json()
      
      // Calculate points earned (10% of order total)
      const pontos_ganhos = Math.floor(orderData.valor_total * 0.1)
      
      // Try to use a transaction, but fallback to individual operations if transaction functions aren't working
      let useTransactions = true;
      try {
        // Check if transaction functions exist by calling one
        const { error: testTxError } = await supabaseClient.rpc('begin_transaction');
        if (testTxError) {
          console.error("Transaction functions not working, fallback to direct operations:", testTxError);
          useTransactions = false;
        }
      } catch (error) {
        console.error("Error testing transaction functions:", error);
        useTransactions = false;
      }
      
      // Start creating the order
      try {
        // Begin transaction if available
        if (useTransactions) {
          const { error: txBeginError } = await supabaseClient.rpc('begin_transaction');
          if (txBeginError) throw new Error(`Transaction begin error: ${txBeginError.message}`);
        }
        
        // Create order
        const { data: order, error: orderError } = await supabaseClient
          .from('orders')
          .insert({
            cliente_id: user.id,
            valor_total: orderData.valor_total,
            pontos_ganhos: pontos_ganhos,
            status: orderData.status || 'Em Separação',
            forma_pagamento: orderData.forma_pagamento,
            rastreio: orderData.rastreio,
            endereco_entrega: orderData.endereco_entrega,
          })
          .select()
          .single();
        
        if (orderError) throw new Error(`Order creation error: ${orderError.message}`);
        
        // Create order items
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
        
        if (itemsError) throw new Error(`Order items error: ${itemsError.message}`);
        
        // Add points transaction
        const { error: pointsError } = await supabaseClient
          .from('points_transactions')
          .insert({
            user_id: user.id,
            pontos: pontos_ganhos,
            tipo: 'compra',
            referencia_id: order.id,
            descricao: `Pontos ganhos na compra #${order.id.substring(0,8)}`
          });
        
        if (pointsError) throw new Error(`Points transaction error: ${pointsError.message}`);
        
        // Update user points balance
        const { error: profileError } = await supabaseClient
          .rpc('update_user_points', { 
            user_id: user.id, 
            points_to_add: pontos_ganhos 
          });
        
        if (profileError) throw new Error(`Update points error: ${profileError.message}`);
        
        // Commit transaction if we're using them
        if (useTransactions) {
          const { error: commitError } = await supabaseClient.rpc('commit_transaction');
          if (commitError) throw new Error(`Transaction commit error: ${commitError.message}`);
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
            await supabaseClient.rpc('rollback_transaction');
          } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: false,
            error: error.message || 'Erro ao processar pedido' 
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // If the request doesn't match any of the above conditions
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
