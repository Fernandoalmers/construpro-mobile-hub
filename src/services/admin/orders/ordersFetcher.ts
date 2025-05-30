
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

    // Primeira query para buscar os pedidos com profiles
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

    // Add status filter if provided
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

    // Para cada pedido, buscar os itens e informações do vendedor
    const processedOrders: AdminOrder[] = await Promise.all(
      orders.map(async (order: any) => {
        console.log(`[AdminOrders] Processing order ${order.id.substring(0, 8)} for customer ${order.profiles?.nome}`);
        
        // Buscar order_items com produtos e vendedores em uma query otimizada
        const { data: orderItemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
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
          `)
          .eq('order_id', order.id);

        if (itemsError) {
          console.error(`[AdminOrders] Error fetching items for order ${order.id}:`, itemsError);
        }

        // Processar itens e determinar vendedor principal
        let loja_nome = 'Loja não identificada';
        let loja_id: string | undefined;
        const items = (orderItemsData || []).map((item: any) => {
          const produto = item.produtos;
          const vendedor = produto?.vendedores;

          // Log para debug
          console.log(`[AdminOrders] Item ${item.id}: produto=${produto?.nome}, vendedor=${vendedor?.nome_loja}`);

          // Se ainda não temos um vendedor principal e este item tem vendedor, usar como principal
          if (vendedor && vendedor.nome_loja && !loja_id) {
            loja_id = vendedor.id;
            loja_nome = vendedor.nome_loja;
            console.log(`[AdminOrders] Setting main vendor for order ${order.id}: ${loja_nome} (${loja_id})`);
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

        // Log final do processamento
        console.log(`[AdminOrders] Order ${order.id.substring(0, 8)} processed:`, {
          customer: order.profiles?.nome,
          vendor: loja_nome,
          vendor_id: loja_id,
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
      })
    );

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
