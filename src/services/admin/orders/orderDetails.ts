
import { supabase } from '@/integrations/supabase/client';
import { AdminOrder, AdminOrderItem } from './types';

export const getOrderDetails = async (orderId: string): Promise<AdminOrder | null> => {
  try {
    console.log(`[OrderDetails] Fetching details for order ${orderId.substring(0, 8)}...`);
    
    // Buscar dados básicos do pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
        
    if (orderError || !order) {
      console.error(`[OrderDetails] Order not found:`, orderError);
      return null;
    }

    console.log(`[OrderDetails] Found order in orders table`);

    // Buscar nome do cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', order.cliente_id)
      .single();
        
    if (clienteError) {
      console.error('Error fetching client name:', clienteError);
    }

    // Buscar itens do pedido separadamente
    console.log(`[OrderDetails] Fetching items for order ${orderId.substring(0, 8)}...`);
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
        
    if (itemsError) {
      console.error('[OrderDetails] Error fetching order items:', itemsError);
      return {
        ...order,
        cliente_nome: cliente?.nome || 'Cliente Desconhecido',
        loja_nome: 'Erro ao carregar itens',
        items: []
      };
    }

    if (!orderItems || orderItems.length === 0) {
      console.warn(`[OrderDetails] No items found for order ${orderId}`);
      return {
        ...order,
        cliente_nome: cliente?.nome || 'Cliente Desconhecido',
        loja_nome: 'Pedido sem itens',
        items: []
      };
    }

    console.log(`[OrderDetails] Found ${orderItems.length} items`);

    // Buscar dados dos produtos separadamente
    const productIds = orderItems.map(item => item.produto_id);
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id, nome, vendedor_id')
      .in('id', productIds);

    if (produtosError) {
      console.error('[OrderDetails] Error fetching products:', produtosError);
      return {
        ...order,
        cliente_nome: cliente?.nome || 'Cliente Desconhecido',
        loja_nome: 'Erro ao carregar produtos',
        items: []
      };
    }

    // Buscar dados dos vendedores
    const vendorIds = produtos?.map(p => p.vendedor_id).filter(Boolean) || [];
    let vendorInfo = null;
    
    if (vendorIds.length > 0) {
      const { data: vendedores, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .in('id', vendorIds);

      if (vendedoresError) {
        console.error('[OrderDetails] Error fetching vendors:', vendedoresError);
      } else if (vendedores && vendedores.length > 0) {
        vendorInfo = vendedores[0]; // Pegar o primeiro vendedor
      }
    }

    // Processar itens combinando com dados dos produtos
    const items: AdminOrderItem[] = orderItems.map(item => {
      const produto = produtos?.find(p => p.id === item.produto_id);
      
      return {
        id: item.id,
        produto_id: item.produto_id,
        produto_nome: produto?.nome || 'Produto não encontrado',
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      };
    });

    console.log(`[OrderDetails] Successfully processed order with ${items.length} items and vendor: ${vendorInfo?.nome_loja || 'Não identificado'}`);
    
    return {
      ...order,
      cliente_nome: cliente?.nome || 'Cliente Desconhecido',
      loja_id: vendorInfo?.id,
      loja_nome: vendorInfo?.nome_loja || 'Loja não identificada',
      items
    };
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    return null;
  }
};
