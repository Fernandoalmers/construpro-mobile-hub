
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { OrderData, OrderItem, ProductData } from './types';
import { getProductImageUrl } from './getOrderById';

export async function getOrders(): Promise<OrderData[]> {
  try {
    console.log("🔍 [orderService.getOrders] Fetching orders for current user");
    
    // Get current authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error("❌ [orderService.getOrders] User not authenticated:", userError);
      toast.error("Você precisa estar logado para ver seus pedidos");
      return [];
    }
    
    const userId = userData.user.id;
    console.log(`👤 [orderService.getOrders] Fetching orders for user: ${userId}`);
    
    // Fetch orders ONLY for the authenticated user
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
        rastreio
      `)
      .eq('cliente_id', userId) // CRITICAL: Filter by authenticated user ID
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error("❌ [orderService.getOrders] Error fetching orders:", ordersError);
      toast.error("Não foi possível carregar seus pedidos", {
        description: ordersError.message
      });
      throw ordersError;
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log("ℹ️ [orderService.getOrders] No orders found for user");
      return [];
    }
    
    console.log(`📦 [orderService.getOrders] Found ${ordersData.length} orders, now fetching items...`);
    
    // Get a list of order IDs to fetch items for
    const orderIds = ordersData.map(order => order.id);
    
    // Fetch order items with additional security check
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
      // Continue with orders, but they won't have items
    }
    
    console.log(`📋 [orderService.getOrders] Fetched ${itemsData?.length || 0} order items`);
    
    // Get unique product IDs from items
    const productIds = itemsData ? [...new Set(itemsData.map(item => item.produto_id))] : [];
    
    // Fetch product data if we have product IDs
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
      }
    }
    
    console.log(`🛍️ [orderService.getOrders] Fetched ${productsData.length} products`);
    
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
        
        console.log(`[orderService.getOrders] Product ${productData.nome} image URL: ${productData.imagem_url}`);
        
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
      console.log(`📦 [orderService.getOrders] Order ${order.id} has ${orderItems.length} items`);
      
      return {
        ...order,
        items: orderItems
      };
    });
    
    console.log(`✅ [orderService.getOrders] Retrieved ${orders.length} orders with items and images for user ${userId}`);
    
    return orders;
  } catch (error: any) {
    console.error("❌ [orderService.getOrders] Error:", error);
    toast.error("Erro ao carregar pedidos", {
      description: error.message || "Tente novamente mais tarde"
    });
    return [];
  }
}

// Export the getProductImageUrl helper for other components to use
export { getProductImageUrl };
