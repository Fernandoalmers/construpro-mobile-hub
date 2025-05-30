
import { AdminOrder } from '../types';

export const processOrders = (
  orders: any[],
  itemsByOrderId: Map<string, any[]>,
  productsMap: Map<string, any>,
  vendorsMap: Map<string, any>,
  profilesMap: Map<string, any>
): AdminOrder[] => {
  console.log(`[AdminOrders] Processing ${orders.length} orders...`);
  
  return orders.map(order => {
    const orderItems = itemsByOrderId.get(order.id) || [];
    const clientProfile = profilesMap.get(order.cliente_id);
    
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

    // Log any orders without items for debugging
    if (items.length === 0) {
      console.warn(`[AdminOrders] Order ${order.id.substring(0, 8)} has no items - potential RLS or data issue`);
    }

    console.log(`[AdminOrders] Order ${order.id.substring(0, 8)} processed:`, {
      customer: clientProfile?.nome,
      customerType: clientProfile?.tipo_perfil,
      vendor: loja_nome,
      vendor_id: loja_id?.substring(0, 8),
      items_count: items.length,
      has_profile: !!clientProfile
    });

    return {
      id: order.id,
      cliente_id: order.cliente_id,
      cliente_nome: clientProfile?.nome || 'Cliente Desconhecido',
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
};
