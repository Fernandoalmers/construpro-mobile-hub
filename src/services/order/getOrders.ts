
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { OrderData, OrderItem, ProductData } from './types';
import { getProductImageUrl } from './getOrderById';

export async function getOrders(): Promise<OrderData[]> {
  try {
    console.log("🔍 [orderService.getOrders] Starting order fetch process");
    
    // Enhanced authentication check with retry logic
    let userData;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      const { data: userDataAttempt, error: userError } = await supabase.auth.getUser();
      
      if (!userError && userDataAttempt?.user) {
        userData = userDataAttempt;
        break;
      }
      
      retryCount++;
      console.warn(`❌ [orderService.getOrders] Auth attempt ${retryCount} failed:`, userError);
      
      if (retryCount < maxRetries) {
        // Try to refresh session
        await supabase.auth.refreshSession();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
      }
    }
    
    if (!userData?.user) {
      console.error("❌ [orderService.getOrders] User not authenticated after retries");
      toast.error("Você precisa estar logado para ver seus pedidos");
      return [];
    }
    
    const userId = userData.user.id;
    console.log(`👤 [orderService.getOrders] Authenticated user ID: ${userId}`);
    console.log(`📧 [orderService.getOrders] User email: ${userData.user.email}`);
    
    // Verify session is still valid
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error("❌ [orderService.getOrders] Session invalid:", sessionError);
      toast.error("Sessão expirada. Faça login novamente.");
      return [];
    }
    
    // Enhanced order query with better error handling
    console.log(`🔍 [orderService.getOrders] Querying orders for user: ${userId}`);
    
    const { data: ordersData, error: ordersError } = await supabase
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
        rastreio,
        cupom_codigo,
        desconto_aplicado
      `)
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error("❌ [orderService.getOrders] Database error:", ordersError);
      toast.error("Erro ao carregar pedidos", {
        description: `Código: ${ordersError.code} - ${ordersError.message}`
      });
      throw ordersError;
    }
    
    console.log(`📊 [orderService.getOrders] Found ${ordersData?.length || 0} orders in database`);
    
    if (!ordersData || ordersData.length === 0) {
      console.log("ℹ️ [orderService.getOrders] No orders found for user");
      return [];
    }
    
    // Log detailed order information for debugging
    ordersData.forEach((order, index) => {
      console.log(`📦 [orderService.getOrders] Order ${index + 1}:`, {
        id: order.id,
        status: order.status,
        valor_total: order.valor_total,
        created_at: order.created_at,
        cliente_id: order.cliente_id
      });
    });
    
    // Get a list of order IDs to fetch items for
    const orderIds = ordersData.map(order => order.id);
    console.log(`📋 [orderService.getOrders] Fetching items for orders:`, orderIds);
    
    // Enhanced order items query with better error handling
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal
      `)
      .in('order_id', orderIds);
    
    if (itemsError) {
      console.error("❌ [orderService.getOrders] Error fetching order items:", itemsError);
      // Continue with orders but they won't have items
      console.warn("⚠️ [orderService.getOrders] Continuing without items due to error");
    }
    
    console.log(`📋 [orderService.getOrders] Fetched ${itemsData?.length || 0} order items`);
    
    // Get unique product IDs from items
    const productIds = itemsData ? [...new Set(itemsData.map(item => item.produto_id))] : [];
    console.log(`🛍️ [orderService.getOrders] Unique product IDs: ${productIds.length}`);
    
    // Enhanced products query
    let productsData: any[] = [];
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          imagens,
          descricao,
          preco_normal,
          preco_promocional,
          categoria,
          vendedor_id
        `)
        .in('id', productIds);
      
      if (productsError) {
        console.error("❌ [orderService.getOrders] Error fetching products:", productsError);
      } else {
        productsData = products || [];
        console.log(`🛍️ [orderService.getOrders] Fetched ${productsData.length} products`);
      }
    }
    
    // Create a map of products by ID for quick lookup
    const productsMap = new Map(productsData.map(product => [product.id, product]));
    
    // Group items by order ID
    const itemsByOrderId: Record<string, OrderItem[]> = {};
    
    if (itemsData && Array.isArray(itemsData)) {
      itemsData.forEach(item => {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        
        // Get product data from the map
        const productFromMap = productsMap.get(item.produto_id);
        
        // Create product data with proper image processing
        const productData: ProductData = {
          id: item.produto_id,
          nome: productFromMap?.nome || 'Produto indisponível',
          imagens: productFromMap?.imagens || [],
          imagem_url: getProductImageUrl(productFromMap),
          descricao: productFromMap?.descricao || '',
          preco_normal: Number(productFromMap?.preco_normal) || item.preco_unitario,
          categoria: productFromMap?.categoria || '',
          preco_promocional: productFromMap?.preco_promocional
        };
        
        const orderItem: OrderItem = {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal || (item.quantidade * item.preco_unitario),
          produto: productData
        };
        
        itemsByOrderId[item.order_id].push(orderItem);
      });
    }
    
    // Combine orders with their items
    const orders: OrderData[] = ordersData.map(order => {
      const orderItems = itemsByOrderId[order.id] || [];
      
      return {
        ...order,
        items: orderItems
      };
    });
    
    console.log(`✅ [orderService.getOrders] Successfully processed ${orders.length} orders`);
    
    // Final debug log with order summaries
    orders.forEach((order, index) => {
      console.log(`📦 [orderService.getOrders] Final order ${index + 1}:`, {
        id: order.id.substring(0, 8),
        itemCount: order.items?.length || 0,
        status: order.status,
        total: order.valor_total
      });
    });
    
    return orders;
    
  } catch (error: any) {
    console.error("❌ [orderService.getOrders] Unexpected error:", error);
    
    // Enhanced error reporting
    const errorMessage = error?.message || 'Erro desconhecido';
    const errorCode = error?.code || 'N/A';
    
    toast.error("Erro ao carregar pedidos", {
      description: `${errorMessage} (Código: ${errorCode})`
    });
    
    return [];
  }
}

// Export the getProductImageUrl helper for other components to use
export { getProductImageUrl };
