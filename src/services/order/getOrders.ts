
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { OrderData, OrderItem, ProductData } from './types';
import { getProductImageUrl } from './getOrderById';

export async function getOrders(): Promise<OrderData[]> {
  try {
    console.log("🔍 [orderService.getOrders] Fetching orders for current user");
    
    // First fetch the orders
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
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error("❌ [orderService.getOrders] Error fetching orders:", ordersError);
      toast.error("Não foi possível carregar seus pedidos", {
        description: ordersError.message
      });
      throw ordersError;
    }
    
    if (!ordersData || ordersData.length === 0) {
      console.log("ℹ️ [orderService.getOrders] No orders found or empty result");
      return [];
    }
    
    // Get a list of order IDs to fetch items for
    const orderIds = ordersData.map(order => order.id);
    
    // Fetch the first item for each order (for display in list)
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        produto:produto_id (
          id,
          nome,
          imagens,
          descricao,
          preco_normal,
          preco_promocional,
          categoria
        )
      `)
      .in('order_id', orderIds);
    
    if (itemsError) {
      console.error("❌ [orderService.getOrders] Error fetching order items:", itemsError);
      // Continue with orders, but they won't have items
    }
    
    // Group items by order ID
    const itemsByOrderId: Record<string, OrderItem[]> = {};
    
    if (itemsData && Array.isArray(itemsData)) {
      // Process items and group them by order_id
      itemsData.forEach(item => {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        
        // Create default product as fallback
        const defaultProduct: ProductData = {
          id: item.produto_id,
          nome: 'Produto indisponível',
          imagens: [] as any[],
          descricao: '',
          preco_normal: item.preco_unitario,
          categoria: '',
          preco_promocional: undefined,
          imagem_url: null
        };
        
        // Process product data safely
        let productData: ProductData = defaultProduct;
        
        if (item.produto !== null && typeof item.produto === 'object') {
          // Safely access produto properties
          const safeProduto = item.produto as Record<string, any>;
          
          if ('id' in safeProduto && 'nome' in safeProduto) {
            // Create a valid product object ensuring all required fields are present
            productData = {
              id: safeProduto.id,
              nome: safeProduto.nome,
              imagens: Array.isArray(safeProduto.imagens) ? safeProduto.imagens : [],
              descricao: safeProduto.descricao || '',
              preco_normal: Number(safeProduto.preco_normal) || item.preco_unitario,
              categoria: safeProduto.categoria || '',
              preco_promocional: safeProduto.preco_promocional,
              imagem_url: getProductImageUrl(safeProduto)
            };
          }
        }
        
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
    const orders: OrderData[] = ordersData.map(order => ({
      ...order,
      items: itemsByOrderId[order.id] || []
    }));
    
    console.log(`✅ [orderService.getOrders] Retrieved ${orders.length} orders with items`);
    
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
