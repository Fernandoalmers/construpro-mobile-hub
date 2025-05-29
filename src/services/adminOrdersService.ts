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

      // Buscar nomes dos clientes
      const clienteIds = orders.map(order => order.cliente_id);
      
      const { data: clientes, error: clientesError } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', clienteIds);
        
      if (clientesError) throw clientesError;

      // Buscar informações das lojas através dos itens do pedido
      const orderIds = orders.map(order => order.id);
      
      // Buscar todos os itens dos pedidos
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, produto_id')
        .in('order_id', orderIds);
        
      if (orderItemsError) throw orderItemsError;

      // Buscar produtos para obter vendedor_id
      const produtoIds = orderItems ? orderItems.map(item => item.produto_id) : [];
      
      let produtos = [];
      if (produtoIds.length > 0) {
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('id, vendedor_id')
          .in('id', produtoIds);
          
        if (produtosError) throw produtosError;
        produtos = produtosData || [];
      }

      // Buscar vendedores
      const vendedorIds = produtos.map(produto => produto.vendedor_id);
      
      let vendedores = [];
      if (vendedorIds.length > 0) {
        const { data: vendedoresData, error: vendedoresError } = await supabase
          .from('vendedores')
          .select('id, nome_loja')
          .in('id', vendedorIds);
          
        if (vendedoresError) throw vendedoresError;
        vendedores = vendedoresData || [];
      }

      // Criar mapas para associação rápida
      const clienteMap = new Map();
      clientes?.forEach(c => clienteMap.set(c.id, c.nome));
      
      const vendedorMap = new Map();
      vendedores.forEach(v => vendedorMap.set(v.id, v.nome_loja));
      
      const produtoVendedorMap = new Map();
      produtos.forEach(p => produtoVendedorMap.set(p.id, p.vendedor_id));
      
      const orderVendedorMap = new Map();
      orderItems?.forEach(item => {
        const vendedorId = produtoVendedorMap.get(item.produto_id);
        if (vendedorId) {
          orderVendedorMap.set(item.order_id, vendedorId);
        }
      });

      // Associar nomes de clientes e vendedores aos pedidos
      return orders.map(order => {
        const vendedorId = orderVendedorMap.get(order.id);
        return {
          ...order,
          cliente_nome: clienteMap.get(order.cliente_id) || 'Cliente Desconhecido',
          loja_id: vendedorId,
          loja_nome: vendedorId ? vendedorMap.get(vendedorId) || 'Loja Desconhecida' : undefined
        };
      });
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
    // Primeiro, tentar buscar na tabela 'orders'
    try {
      const { data: order, error: orderError } = await supabase
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
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;

      // Buscar nome do cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', order.cliente_id)
        .single();
        
      if (clienteError) {
        console.error('Error fetching client name:', clienteError);
      }

      // Buscar itens do pedido
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal
        `)
        .eq('order_id', orderId);
        
      if (itemsError) throw itemsError;

      // Buscar nomes dos produtos e informações do vendedor
      const produtoIds = items.map(item => item.produto_id);
      
      let produtos = [];
      let vendedorInfo = null;
      
      if (produtoIds.length > 0) {
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('id, nome, vendedor_id')
          .in('id', produtoIds);
          
        if (produtosError) throw produtosError;
        produtos = produtosData || [];

        // Buscar informações do vendedor (assumindo que todos os produtos são do mesmo vendedor)
        const vendedorId = produtos.length > 0 ? produtos[0].vendedor_id : null;
        
        if (vendedorId) {
          const { data: vendedor, error: vendedorError } = await supabase
            .from('vendedores')
            .select('id, nome_loja')
            .eq('id', vendedorId)
            .single();
            
          if (vendedorError) {
            console.error('Error fetching vendor info:', vendedorError);
          } else {
            vendedorInfo = vendedor;
          }
        }
      }

      // Criar mapa para associar IDs de produtos aos nomes
      const produtoMap = new Map();
      produtos?.forEach(p => produtoMap.set(p.id, p.nome));

      // Associar nomes dos produtos aos itens
      const itemsWithProductNames = items.map(item => ({
        ...item,
        produto_nome: produtoMap.get(item.produto_id) || 'Produto Desconhecido'
      }));

      // Retornar pedido completo com itens e informações do vendedor
      return {
        ...order,
        cliente_nome: cliente?.nome || 'Cliente Desconhecido',
        loja_id: vendedorInfo?.id,
        loja_nome: vendedorInfo?.nome_loja || undefined,
        items: itemsWithProductNames
      };
    } catch (error) {
      console.log('Erro ao buscar na tabela orders, tentando tabela pedidos:', error);
      
      // Se não encontrar a tabela 'orders', tentar com a tabela 'pedidos'
      const { data: pedido, error: pedidoError } = await supabase
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
        .eq('id', orderId)
        .single();
        
      if (pedidoError) throw pedidoError;

      // Buscar nome do cliente
      const { data: usuario, error: usuarioError } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', pedido.usuario_id)
        .single();
        
      if (usuarioError) {
        console.error('Error fetching user name:', usuarioError);
      }

      // Buscar nome da loja
      const { data: vendedor, error: vendedorError } = await supabase
        .from('vendedores')
        .select('nome_loja')
        .eq('id', pedido.vendedor_id)
        .single();
        
      if (vendedorError) {
        console.error('Error fetching vendor name:', vendedorError);
      }

      // Buscar itens do pedido
      const { data: itens, error: itensError } = await supabase
        .from('itens_pedido')
        .select(`
          id,
          produto_id,
          quantidade,
          preco_unitario,
          total
        `)
        .eq('pedido_id', orderId);
        
      if (itensError) throw itensError;

      // Buscar nomes dos produtos
      const produtoIds = itens.map(item => item.produto_id);
      
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome')
        .in('id', produtoIds);
        
      if (produtosError) throw produtosError;

      // Criar mapa para associar IDs de produtos aos nomes
      const produtoMap = new Map();
      produtos?.forEach(p => produtoMap.set(p.id, p.nome));

      // Associar nomes dos produtos aos itens e transformar no formato esperado
      const itemsTransformed = itens.map(item => ({
        id: item.id,
        produto_id: item.produto_id,
        produto_nome: produtoMap.get(item.produto_id) || 'Produto Desconhecido',
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.total
      }));

      // Transformar dados da tabela 'pedidos' no formato de 'orders'
      return {
        id: pedido.id,
        cliente_id: pedido.usuario_id,
        cliente_nome: usuario?.nome || 'Cliente Desconhecido',
        loja_id: pedido.vendedor_id,
        loja_nome: vendedor?.nome_loja || 'Loja Desconhecida',
        valor_total: pedido.valor_total,
        status: pedido.status,
        forma_pagamento: pedido.forma_pagamento,
        data_criacao: pedido.created_at,
        endereco_entrega: pedido.endereco_entrega,
        pontos_ganhos: 0, // informação não disponível na tabela 'pedidos'
        items: itemsTransformed
      };
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
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
