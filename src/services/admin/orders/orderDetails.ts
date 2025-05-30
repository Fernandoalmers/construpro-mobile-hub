
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Starting order details fetch for ID: ${orderId}`);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error(`[OrderDetails] Invalid UUID format: ${orderId}`);
      return null;
    }

    // Step 1: Get the main order data
    console.log(`[OrderDetails] Fetching order data from 'orders' table...`);
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error(`[OrderDetails] Error fetching order:`, orderError);
      return null;
    }

    if (!orderData) {
      console.error(`[OrderDetails] No order found with ID: ${orderId}`);
      return null;
    }

    console.log(`[OrderDetails] Order found:`, {
      id: orderData.id,
      status: orderData.status,
      valor_total: orderData.valor_total,
      cliente_id: orderData.cliente_id
    });

    // Step 2: Get customer information
    console.log(`[OrderDetails] Fetching customer data for ID: ${orderData.cliente_id}`);
    const { data: customerData, error: customerError } = await supabase
      .from('profiles')
      .select('nome, email, telefone')
      .eq('id', orderData.cliente_id)
      .single();

    if (customerError) {
      console.warn(`[OrderDetails] Customer fetch error:`, customerError);
    }

    // Step 3: Get order items with products and vendors in a single query
    console.log(`[OrderDetails] Fetching order items with products and vendors...`);
    const { data: orderItemsWithProducts, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal,
        produtos!inner (
          id,
          nome,
          vendedor_id,
          vendedores!inner (
            id,
            nome_loja
          )
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error(`[OrderDetails] Error fetching order items with products:`, itemsError);
      return {
        ...orderData,
        cliente_nome: customerData?.nome || 'Cliente Desconhecido',
        loja_nome: 'Erro ao carregar loja',
        items: []
      };
    }

    console.log(`[OrderDetails] Order items with products found:`, {
      itemsCount: orderItemsWithProducts?.length || 0,
      items: orderItemsWithProducts?.map(item => ({
        id: item.id,
        produto_nome: item.produtos?.nome,
        vendor_name: item.produtos?.vendedores?.nome_loja
      }))
    });

    const items: AdminOrderItem[] = [];
    let loja_nome = 'Loja não identificada';
    let loja_id: string | undefined;

    // Step 4: Process order items
    if (orderItemsWithProducts && orderItemsWithProducts.length > 0) {
      for (const item of orderItemsWithProducts) {
        const product = item.produtos;
        const vendor = product?.vendedores;
        
        // Use the first vendor found as the main vendor for the order
        if (vendor && !loja_id) {
          loja_id = vendor.id;
          loja_nome = vendor.nome_loja || 'Loja não identificada';
          console.log(`[OrderDetails] Setting main vendor: ${loja_nome}`);
        }

        items.push({
          id: item.id,
          produto_id: item.produto_id,
          produto_nome: product?.nome || 'Produto não encontrado',
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal
        });
      }
    } else {
      console.warn(`[OrderDetails] No order items found for order: ${orderId}`);
    }

    // Build the final result
    const result: AdminOrder = {
      ...orderData,
      cliente_nome: customerData?.nome || 'Cliente Desconhecido',
      loja_id,
      loja_nome,
      items
    };

    console.log(`[OrderDetails] Final result:`, {
      orderId: result.id,
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
