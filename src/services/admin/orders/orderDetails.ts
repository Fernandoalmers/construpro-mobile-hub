
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Fetching complete order details for ${orderId.substring(0, 8)} using JOIN query...`);
    
    // Query única com JOINs para buscar todos os dados necessários
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        cliente_nome:profiles!orders_cliente_id_fkey(nome),
        order_items (
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          produto:produtos!order_items_produto_id_fkey (
            id,
            nome,
            vendedor:vendedores!produtos_vendedor_id_fkey (
              id,
              nome_loja
            )
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error(`[OrderDetails] Error fetching order:`, orderError);
      return null;
    }

    if (!orderData) {
      console.warn(`[OrderDetails] Order ${orderId} not found`);
      return null;
    }

    console.log(`[OrderDetails] Raw order data:`, JSON.stringify(orderData, null, 2));

    // Processar os itens do pedido
    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    if (orderData.order_items && Array.isArray(orderData.order_items)) {
      console.log(`[OrderDetails] Processing ${orderData.order_items.length} order items`);
      
      orderData.order_items.forEach((item: any) => {
        console.log(`[OrderDetails] Processing item:`, JSON.stringify(item, null, 2));
        
        const produto = item.produto;
        const vendedor = produto?.vendedor;
        
        // Usar o primeiro vendedor encontrado como referência principal
        if (vendedor && !loja_id) {
          loja_id = vendedor.id;
          loja_nome = vendedor.nome_loja || 'Loja não identificada';
          console.log(`[OrderDetails] Setting main vendor: ${loja_nome} (${loja_id})`);
        }

        items.push({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: produto?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        });
      });

      console.log(`[OrderDetails] Successfully processed ${items.length} items for vendor: ${loja_nome}`);
    } else {
      console.warn(`[OrderDetails] No order_items found or invalid format for order ${orderId}`);
    }

    // Construir o objeto de retorno
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: orderData.cliente_nome?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result for order ${orderId.substring(0, 8)}:`, {
      orderId: result.id.substring(0, 8),
      clienteNome: result.cliente_nome,
      lojaNome: result.loja_nome,
      itemsCount: result.items?.length || 0,
      valorTotal: result.valor_total
    });

    return result;
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    return null;
  }
};
