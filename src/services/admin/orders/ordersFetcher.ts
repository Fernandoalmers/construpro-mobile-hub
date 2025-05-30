
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder } from './types';

interface FetchOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface FetchOrdersResult {
  orders: AdminOrder[];
  totalCount: number;
  hasMore: boolean;
}

export const fetchAdminOrders = async (params: FetchOrdersParams = {}): Promise<FetchOrdersResult> => {
  try {
    const { page = 1, limit = 25, status } = params;
    const offset = (page - 1) * limit;

    console.log(`[AdminOrders] Fetching orders - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Step 1: Fetch orders with customer profiles
    let baseQuery = supabase
      .from('orders')
      .select(`
        id,
        cliente_id,
        valor_total,
        status,
        forma_pagamento,
        data_criacao,
        created_at,
        endereco_entrega,
        rastreio,
        pontos_ganhos,
        profiles!orders_cliente_id_fkey(nome)
      `, { count: 'exact' })
      .order('data_criacao', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      baseQuery = baseQuery.eq('status', status);
    }

    const { data: orders, error, count } = await baseQuery;

    if (error) {
      console.error('[AdminOrders] Error fetching orders:', error);
      throw error;
    }

    if (!orders || orders.length === 0) {
      console.log('[AdminOrders] No orders found');
      return { orders: [], totalCount: count || 0, hasMore: false };
    }

    console.log(`[AdminOrders] Successfully fetched ${orders.length} orders from ${count} total`);

    // Step 2: Get all order IDs to fetch items
    const orderIds = orders.map(order => order.id);
    
    // Step 3: Fetch all order items for these orders
    const { data: allOrderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (itemsError) {
      console.error('[AdminOrders] Error fetching order items:', itemsError);
    }

    // Step 4: Get all unique product IDs
    const productIds = [...new Set((allOrderItems || []).map(item => item.produto_id))];
    
    // Step 5: Fetch all products
    const { data: allProducts, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, vendedor_id')
      .in('id', productIds);

    if (productsError) {
      console.error('[AdminOrders] Error fetching products:', productsError);
    }

    // Step 6: Get all unique vendor IDs
    const vendorIds = [...new Set((allProducts || []).map(p => p.vendedor_id).filter(Boolean))];
    
    // Step 7: Fetch all vendors
    const { data: allVendors, error: vendorsError } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .in('id', vendorIds);

    if (vendorsError) {
      console.error('[AdminOrders] Error fetching vendors:', vendorsError);
    }

    // Step 8: Create lookup maps
    const itemsByOrderId = new Map();
    (allOrderItems || []).forEach(item => {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id).push(item);
    });

    const productsMap = new Map((allProducts || []).map(p => [p.id, p]));
    const vendorsMap = new Map((allVendors || []).map(v => [v.id, v]));

    // Step 9: Process each order
    const processedOrders: AdminOrder[] = orders.map(order => {
      const orderItems = itemsByOrderId.get(order.id) || [];
      
      // Process items and determine vendor
      let loja_nome = 'Loja não identificada';
      let loja_id: string | undefined;
      
      const items = orderItems.map((item: any) => {
        const produto = productsMap.get(item.produto_id);
        const vendedor = produto?.vendedor_id ? vendorsMap.get(produto.vendedor_id) : null;

        // Use the first vendor found as the main vendor for the order
        if (vendedor && vendedor.nome_loja && !loja_id) {
          loja_id = produto.vendedor_id;
          loja_nome = vendedor.nome_loja;
          console.log(`[AdminOrders] Setting main vendor for order ${order.id.substring(0, 8)}: ${loja_nome}`);
        }

        return {
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: produto?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        };
      });

      console.log(`[AdminOrders] Order ${order.id.substring(0, 8)} processed:`, {
        customer: order.profiles?.nome,
        vendor: loja_nome,
        vendor_id: loja_id?.substring(0, 8),
        items_count: items.length
      });

      return {
        id: order.id,
        cliente_id: order.cliente_id,
        cliente_nome: order.profiles?.nome || 'Cliente Desconhecido',
        loja_id,
        loja_nome,
        valor_total: order.valor_total,
        status: order.status,
        forma_pagamento: order.forma_pagamento,
        data_criacao: order.data_criacao,
        created_at: order.created_at,
        endereco_entrega: order.endereco_entrega,
        rastreio: order.rastreio,
        pontos_ganhos: order.pontos_ganhos,
        items
      };
    });

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    console.log(`[AdminOrders] Processed ${processedOrders.length} orders. Total: ${totalCount}, HasMore: ${hasMore}`);

    return {
      orders: processedOrders,
      totalCount,
      hasMore
    };

  } catch (error) {
    console.error('[AdminOrders] Error in fetchAdminOrders:', error);
    throw error;
  }
};

// Backward compatibility - export the original function signature
export const fetchAdminOrdersLegacy = async (): Promise<AdminOrder[]> => {
  const result = await fetchAdminOrders({ page: 1, limit: 50 });
  return result.orders;
};
