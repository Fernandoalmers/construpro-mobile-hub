
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

    // Build the query with JOINs to get all data in a single request
    let query = supabase
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
        profiles!orders_cliente_id_fkey(nome),
        order_items(
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          produtos!order_items_produto_id_fkey(
            id,
            nome,
            vendedor_id,
            vendedores!produtos_vendedor_id_fkey(
              id,
              nome_loja
            )
          )
        )
      `, { count: 'exact' })
      .order('data_criacao', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('[AdminOrders] Error fetching orders:', error);
      throw error;
    }

    if (!orders) {
      console.log('[AdminOrders] No orders found');
      return { orders: [], totalCount: 0, hasMore: false };
    }

    console.log(`[AdminOrders] Successfully fetched ${orders.length} orders from ${count} total`);

    // Process the orders to the expected format
    const processedOrders: AdminOrder[] = orders.map((order: any) => {
      // Extract customer name
      const cliente_nome = order.profiles?.nome || 'Cliente Desconhecido';

      // Process order items and get vendor info
      let loja_nome = 'Loja não identificada';
      let loja_id: string | undefined;
      const items = order.order_items?.map((item: any) => {
        const produto = item.produtos;
        const vendedor = produto?.vendedores;

        // Use the first vendor found as the main vendor for the order
        if (vendedor && !loja_id) {
          loja_id = vendedor.id;
          loja_nome = vendedor.nome_loja || 'Loja não identificada';
        }

        return {
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: produto?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        };
      }) || [];

      return {
        id: order.id,
        cliente_id: order.cliente_id,
        cliente_nome,
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
