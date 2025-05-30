
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Fetching order details for ${orderId.substring(0, 8)}...`);
    
    // Step 1: Get the main order data with customer info
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_cliente_id_fkey(nome)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error(`[OrderDetails] Error fetching order:`, orderError);
      return null;
    }

    console.log(`[OrderDetails] Order found:`, {
      id: orderData.id.substring(0, 8),
      status: orderData.status,
      valor_total: orderData.valor_total,
      cliente_id: orderData.cliente_id.substring(0, 8),
      cliente_nome: orderData.profiles?.nome
    });

    // Step 2: Get order items with products and vendors in one optimized query
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
      .eq('order_id', orderId);

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items:`, itemsError);
      return {
        ...orderData,
        cliente_nome: orderData.profiles?.nome || 'Cliente Desconhecido',
        loja_nome: 'Loja não identificada',
        items: []
      };
    }

    console.log(`[OrderDetails] Found ${orderItemsData?.length || 0} order items`);

    // Step 3: Process items and determine vendor
    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    if (orderItemsData && orderItemsData.length > 0) {
      for (const item of orderItemsData) {
        const produto = item.produtos;
        const vendedor = produto?.vendedores;
        
        console.log(`[OrderDetails] Processing item:`, {
          item_id: item.id,
          produto_nome: produto?.nome,
          vendedor_nome: vendedor?.nome_loja,
          vendedor_id: vendedor?.id
        });

        // Use the first vendor found as the main vendor for the order
        if (vendedor && vendedor.nome_loja && !loja_id) {
          loja_id = vendedor.id;
          loja_nome = vendedor.nome_loja;
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
      }
    }

    // Step 4: Verify total calculation
    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    console.log(`[OrderDetails] Total verification:`, {
      orderTotal: orderData.valor_total,
      calculatedTotal,
      difference: Math.abs(orderData.valor_total - calculatedTotal)
    });

    // Build the final result
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: orderData.profiles?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result:`, {
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
