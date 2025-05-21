
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from './utils.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to get user ID from the Authorization header
async function getUserId(authHeader: string): Promise<string | null> {
  try {
    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Error getting user ID from token:', error)
      return null
    }

    return user?.id || null
  } catch (e) {
    console.error('Error extracting user ID:', e)
    return null
  }
}

// Function to handle GET requests for all orders
export async function handleGetOrders(req: Request, authHeader: string): Promise<Response> {
  try {
    const userId = await getUserId(authHeader)
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not retrieve user ID' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const { data: orders, error } = await supabase
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
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch orders' }),
        { status: 500, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ success: true, orders }),
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Unexpected error in handleGetOrders:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

// Function to handle GET requests for a specific order by ID
export async function handleGetOrderById(req: Request, authHeader: string, orderId: string): Promise<Response> {
  try {
    const userId = await getUserId(authHeader);
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not retrieve user ID' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Fetch order details first
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('cliente_id', userId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch order' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!orderData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Now fetch order items separately to avoid recursion issues
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        produto:produtos (
          id,
          nome,
          imagens,
          preco_normal,
          preco_promocional,
          descricao,
          categoria
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      // We'll continue even with item error and just return the order data
    }

    // Combine order with items
    const fullOrderData = {
      ...orderData,
      items: itemsData || []
    };

    return new Response(
      JSON.stringify({ success: true, order: fullOrderData }),
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Unexpected error in handleGetOrderById:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Function to handle POST requests to create a new order
export async function handleCreateOrder(req: Request, authHeader: string): Promise<Response> {
  try {
    const userId = await getUserId(authHeader)
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not retrieve user ID' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Items are required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!body.endereco_entrega) {
      return new Response(
        JSON.stringify({ success: false, error: 'Endereço de entrega is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (!body.forma_pagamento) {
      return new Response(
        JSON.stringify({ success: false, error: 'Forma de pagamento is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (typeof body.valor_total !== 'number') {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor total is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    if (typeof body.pontos_ganhos !== 'number') {
      return new Response(
        JSON.stringify({ success: false, error: 'Pontos ganhos is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Start a database transaction
    const { data: orderResult, error: orderError } = await supabase.from('orders').insert({
      cliente_id: userId,
      valor_total: body.valor_total,
      pontos_ganhos: body.pontos_ganhos,
      status: body.status || 'Confirmado',
      forma_pagamento: body.forma_pagamento,
      endereco_entrega: body.endereco_entrega
    }).select().single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create order' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const orderId = orderResult.id

    // Insert order items
    const orderItems = body.items.map((item: any) => ({
      order_id: orderId,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
    }))

    const { data: itemsResult, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)

      // If items fail, rollback the order
      await supabase.from('orders').delete().eq('id', orderId)

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create order items' }),
        { status: 500, headers: corsHeaders }
      )
    }

    // If all operations were successful, commit the transaction
    return new Response(
      JSON.stringify({ success: true, order: orderResult }),
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('Unexpected error in handleCreateOrder:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
}
