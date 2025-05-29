import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';

export interface AdminOrderItem {
  id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface AdminOrder {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  loja_id?: string;
  loja_nome?: string;
  valor_total: number;
  status: string;
  forma_pagamento: string;
  data_criacao: string;
  created_at?: string;
  endereco_entrega: any;
  rastreio?: string;
  pontos_ganhos: number;
  items?: AdminOrderItem[];
}

export const fetchAdminOrders = async (): Promise<AdminOrder[]> => {
  try {
    // Primeiro, tentar buscar na tabela 'orders'
    try {
      console.log('[AdminOrders] Fetching orders from orders table...');
      
      const { data: orders, error: ordersError } = await supabase
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
          pontos_ganhos
        `)
        .order('data_criacao', { ascending: false });
        
      if (ordersError) throw ordersError;
      console.log(`[AdminOrders] Found ${orders?.length || 0} orders`);

      // Buscar nomes dos clientes
      const clienteIds = orders.map(order => order.cliente_id);
      console.log(`[AdminOrders] Fetching client names for ${clienteIds.length} clients`);
      
      const { data: clientes, error: clientesError } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', clienteIds);
        
      if (clientesError) throw clientesError;
      console.log(`[AdminOrders] Found ${clientes?.length || 0} client profiles`);

      // Criar mapa de clientes
      const clienteMap = new Map();
      clientes?.forEach(c => clienteMap.set(c.id, c.nome));

      // Processar cada pedido individualmente para garantir que todos tenham vendedor
      const ordersWithVendors = await Promise.all(
        orders.map(async (order) => {
          try {
            console.log(`[AdminOrders] Processing order ${order.id.substring(0, 8)}...`);
            
            // Buscar itens do pedido
            const { data: orderItems, error: orderItemsError } = await supabase
              .from('order_items')
              .select('produto_id')
              .eq('order_id', order.id);
              
            if (orderItemsError) {
              console.error(`[AdminOrders] Error fetching items for order ${order.id}:`, orderItemsError);
              // Continuar mesmo sem itens
              return {
                ...order,
                cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
                loja_nome: 'Erro ao carregar loja'
              };
            }

            if (!orderItems || orderItems.length === 0) {
              console.warn(`[AdminOrders] No items found for order ${order.id}`);
              return {
                ...order,
                cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
                loja_nome: 'Pedido sem itens'
              };
            }

            // Buscar produtos para obter vendedor_id
            const produtoIds = orderItems.map(item => item.produto_id);
            console.log(`[AdminOrders] Fetching ${produtoIds.length} products for order ${order.id.substring(0, 8)}`);
            
            const { data: produtos, error: produtosError } = await supabase
              .from('produtos')
              .select('id, vendedor_id')
              .in('id', produtoIds);
              
            if (produtosError) {
              console.error(`[AdminOrders] Error fetching products for order ${order.id}:`, produtosError);
              return {
                ...order,
                cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
                loja_nome: 'Erro ao carregar produtos'
              };
            }

            if (!produtos || produtos.length === 0) {
              console.warn(`[AdminOrders] No products found for order ${order.id}`);
              return {
                ...order,
                cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
                loja_nome: 'Produtos não encontrados'
              };
            }

            // Pegar o primeiro vendedor (assumindo que todos os produtos são do mesmo vendedor)
            const vendedorId = produtos[0].vendedor_id;
            console.log(`[AdminOrders] Found vendor ${vendedorId} for order ${order.id.substring(0, 8)}`);
            
            if (!vendedorId) {
              console.warn(`[AdminOrders] No vendor found for products in order ${order.id}`);
              return {
                ...order,
                cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
                loja_nome: 'Vendedor não identificado'
              };
            }

            // Buscar nome do vendedor
            const { data: vendedor, error: vendedorError } = await supabase
              .from('vendedores')
              .select('id, nome_loja')
              .eq('id', vendedorId)
              .single();
              
            if (vendedorError) {
              console.error(`[AdminOrders] Error fetching vendor ${vendedorId}:`, vendedorError);
              return {
                ...order,
                cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
                loja_id: vendedorId,
                loja_nome: 'Erro ao carregar vendedor'
              };
            }

            console.log(`[AdminOrders] Successfully processed order ${order.id.substring(0, 8)} - Vendor: ${vendedor?.nome_loja}`);
            
            return {
              ...order,
              cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
              loja_id: vendedor?.id,
              loja_nome: vendedor?.nome_loja || 'Loja Desconhecida'
            };
            
          } catch (error) {
            console.error(`[AdminOrders] Error processing order ${order.id}:`, error);
            return {
              ...order,
              cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
              loja_nome: 'Erro no processamento'
            };
          }
        })
      );

      console.log(`[AdminOrders] Successfully processed ${ordersWithVendors.length} orders from orders table`);
      return ordersWithVendors;
      
    } catch (error) {
      console.log('Erro ao buscar na tabela orders, tentando tabela pedidos:', error);
      
      // Se não encontrar a tabela 'orders', tentar com a tabela 'pedidos'
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id,
          usuario_id,
          vendedor_id,
          valor_total,
          status,
          forma_pagamento,
          created_at,
          endereco_entrega
        `)
        .order('created_at', { ascending: false });
        
      if (pedidosError) throw pedidosError;

      // Buscar nomes dos clientes
      const usuarioIds = pedidos.map(pedido => pedido.usuario_id);
      
      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', usuarioIds);
        
      if (usuariosError) throw usuariosError;

      // Buscar nomes das lojas/vendedores
      const vendedorIds = pedidos.map(pedido => pedido.vendedor_id);
      
      const { data: vendedores, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .in('id', vendedorIds);
        
      if (vendedoresError) throw vendedoresError;

      // Criar mapas para associação rápida
      const usuarioMap = new Map();
      usuarios?.forEach(u => usuarioMap.set(u.id, u.nome));
      
      const vendedorMap = new Map();
      vendedores?.forEach(v => vendedorMap.set(v.id, v.nome_loja));

      // Transformar dados da tabela 'pedidos' no formato de 'orders'
      return pedidos.map(pedido => ({
        id: pedido.id,
        cliente_id: pedido.usuario_id,
        cliente_nome: usuarioMap.get(pedido.usuario_id) || 'Cliente Desconhecido',
        loja_id: pedido.vendedor_id,
        loja_nome: vendedorMap.get(pedido.vendedor_id) || 'Loja Desconhecida',
        valor_total: pedido.valor_total,
        status: pedido.status,
        forma_pagamento: pedido.forma_pagamento,
        data_criacao: pedido.created_at,
        endereco_entrega: pedido.endereco_entrega,
        pontos_ganhos: 0 // informação não disponível na tabela 'pedidos'
      }));
    }
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    toast.error('Erro ao carregar pedidos');
    return [];
  }
};

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

    // Buscar itens do pedido com JOIN diretamente
    console.log(`[OrderDetails] Fetching items for order ${orderId.substring(0, 8)}...`);
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
      console.error('[OrderDetails] Error fetching order items with products:', itemsError);
      return {
        ...order,
        cliente_nome: cliente?.nome || 'Cliente Desconhecido',
        loja_nome: 'Erro ao carregar itens',
        items: []
      };
    }

    if (!orderItemsWithProducts || orderItemsWithProducts.length === 0) {
      console.warn(`[OrderDetails] No items found for order ${orderId}`);
      return {
        ...order,
        cliente_nome: cliente?.nome || 'Cliente Desconhecido',
        loja_nome: 'Pedido sem itens',
        items: []
      };
    }

    console.log(`[OrderDetails] Found ${orderItemsWithProducts.length} items`);

    // Processar itens e extrair informações do vendedor
    const items: AdminOrderItem[] = orderItemsWithProducts.map(item => ({
      id: item.id,
      produto_id: item.produto_id,
      produto_nome: item.produtos.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal
    }));

    // Pegar informações do vendedor do primeiro item
    const firstItem = orderItemsWithProducts[0];
    const vendorInfo = firstItem.produtos.vendedores;

    console.log(`[OrderDetails] Successfully processed order with ${items.length} items and vendor: ${vendorInfo.nome_loja}`);
    
    return {
      ...order,
      cliente_nome: cliente?.nome || 'Cliente Desconhecido',
      loja_id: vendorInfo.id,
      loja_nome: vendorInfo.nome_loja || 'Loja não identificada',
      items
    };
    
  } catch (error) {
    console.error('[OrderDetails] Unexpected error:', error);
    toast.error('Erro ao carregar detalhes do pedido');
    return null;
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    // Primeiro tentar na tabela 'orders'
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Log the admin action
      await logAdminAction({
        action: 'update_order_status',
        entityType: 'pedido',
        entityId: orderId,
        details: { status: newStatus }
      });
      
      toast.success('Status do pedido atualizado com sucesso');
      return true;
    } catch (error) {
      console.log('Erro ao atualizar na tabela orders, tentando tabela pedidos:', error);
      
      // Se falhar, tentar na tabela 'pedidos'
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (pedidoError) throw pedidoError;
      
      // Log the admin action
      await logAdminAction({
        action: 'update_order_status',
        entityType: 'pedido',
        entityId: orderId,
        details: { status: newStatus }
      });
      
      toast.success('Status do pedido atualizado com sucesso');
      return true;
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};

export const updateTrackingCode = async (orderId: string, trackingCode: string): Promise<boolean> => {
  try {
    // Esta funcionalidade só está disponível na tabela 'orders'
    const { error } = await supabase
      .from('orders')
      .update({ rastreio: trackingCode })
      .eq('id', orderId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'update_tracking_code',
      entityType: 'pedido',
      entityId: orderId,
      details: { rastreio: trackingCode }
    });
    
    toast.success('Código de rastreio atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating tracking code:', error);
    toast.error('Erro ao atualizar código de rastreio');
    return false;
  }
};

export const getOrderStatusBadgeColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'concluído':
    case 'concluido':
    case 'entregue':
      return 'bg-green-100 text-green-800';
    case 'pendente':
    case 'processando':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelado':
      return 'bg-red-100 text-red-800';
    case 'enviado':
    case 'em transporte':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
