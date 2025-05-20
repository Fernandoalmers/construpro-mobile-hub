
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder, OrderFilters } from '../types';

/**
 * Busca pedidos diretamente do banco de dados para um vendedor específico
 * Agora consultando tanto a tabela 'orders' quanto 'pedidos'
 */
export const fetchDirectVendorOrders = async (
  vendorId: string,
  filters?: OrderFilters
): Promise<VendorOrder[]> => {
  try {
    console.log(`🔍 [fetchDirectVendorOrders] Buscando pedidos para o vendedor: ${vendorId}`);
    
    // Primeiro, buscar pedidos da tabela 'pedidos' (específicos para vendedor)
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        id,
        usuario_id,
        vendedor_id,
        status,
        forma_pagamento,
        endereco_entrega,
        valor_total,
        created_at,
        data_entrega_estimada
      `)
      .eq('vendedor_id', vendorId)
      .order('created_at', { ascending: false });
      
    if (pedidosError) {
      console.error('🚫 [fetchDirectVendorOrders] Erro ao buscar pedidos da tabela pedidos:', pedidosError);
    }

    // Depois, buscar pedidos da tabela 'orders' onde produtos deste vendedor foram incluídos
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        cliente_id,
        status,
        forma_pagamento,
        endereco_entrega,
        valor_total,
        created_at,
        pontos_ganhos,
        rastreio
      `);
      
    if (ordersError) {
      console.error('🚫 [fetchDirectVendorOrders] Erro ao buscar pedidos da tabela orders:', ordersError);
    }
    
    // Filtrar orders para incluir apenas aqueles que contêm produtos deste vendedor
    let vendorOrders: VendorOrder[] = [];
    
    // Processar orders caso existam
    if (orders && orders.length > 0) {
      console.log(`📦 [fetchDirectVendorOrders] Encontrados ${orders.length} pedidos na tabela 'orders'. Filtrando por vendedor...`);
      
      // Para cada order, verificar se contém produtos deste vendedor
      const orderItems = await Promise.all(orders.map(async (order) => {
        // Buscar itens de pedido para este order
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            produtos!inner(id, vendedor_id)
          `)
          .eq('order_id', order.id);
          
        if (itemsError) {
          console.error(`🚫 [fetchDirectVendorOrders] Erro ao buscar itens do pedido ${order.id}:`, itemsError);
          return null;
        }
        
        // Adicionar verificação extra para garantir que items existe antes de filtrar
        if (!items) {
          return null;
        }
        
        // Filtrar para incluir apenas itens com produtos deste vendedor
        const vendorItems = items.filter(item => {
          // Verificar se o produto existe e tem vendedor_id
          return item.produtos !== null && 
                 item.produtos !== undefined && 
                 typeof item.produtos === 'object' && 
                 'vendedor_id' in item.produtos && 
                 item.produtos.vendedor_id === vendorId;
        });
        
        if (vendorItems.length > 0) {
          // Calcular o subtotal para este vendedor
          const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
          
          // Buscar informações do cliente
          const { data: cliente } = await supabase
            .from('profiles')
            .select('id, nome, email, telefone')
            .eq('id', order.cliente_id)
            .single();
          
          // Mapear para o formato VendorOrder com informações extras para corresponder ao tipo
          const customerInfo = cliente ? {
            id: cliente.id,
            nome: cliente.nome || '',
            email: cliente.email || '',
            telefone: cliente.telefone || '',
            usuario_id: cliente.id, // Usando o mesmo ID para manter consistência
            vendedor_id: vendorId,  // Adicionando vendedor_id para corresponder ao tipo VendorCustomer
            total_gasto: vendorTotal // Adicionando total_gasto com o valor atual
          } : null;
          
          // Mapear para o formato VendorOrder
          return {
            id: order.id,
            cliente_id: order.cliente_id,
            vendedor_id: vendorId,
            valor_total: vendorTotal,
            status: order.status,
            forma_pagamento: order.forma_pagamento,
            endereco_entrega: order.endereco_entrega,
            created_at: order.created_at,
            rastreio: order.rastreio || null,
            cliente: customerInfo,
            itens: vendorItems.map(item => ({
              id: item.id,
              order_id: item.order_id,
              produto_id: item.produto_id,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              subtotal: item.subtotal,
              total: item.subtotal
            }))
          };
        }
        return null;
      }));
      
      // Filtrar orders nulos (aqueles sem itens deste vendedor)
      vendorOrders = (orderItems.filter(Boolean) as VendorOrder[]);
    }
    
    // Processar pedidos caso existam
    if (pedidos && pedidos.length > 0) {
      console.log(`📦 [fetchDirectVendorOrders] Encontrados ${pedidos.length} registros na tabela 'pedidos'`);
      
      const pedidosFormatted = await Promise.all(pedidos.map(async (pedido) => {
        // Buscar itens de pedido
        const { data: itens, error: itensError } = await supabase
          .from('itens_pedido')
          .select(`
            id,
            pedido_id,
            produto_id,
            quantidade,
            preco_unitario,
            total
          `)
          .eq('pedido_id', pedido.id);
          
        if (itensError) {
          console.error(`🚫 [fetchDirectVendorOrders] Erro ao buscar itens do pedido ${pedido.id}:`, itensError);
        }
        
        // Buscar informações do cliente
        const { data: cliente } = await supabase
          .from('profiles')
          .select('id, nome, email, telefone')
          .eq('id', pedido.usuario_id)
          .single();
        
        // Criar objeto cliente no formato VendorCustomer
        const customerInfo = cliente ? {
          id: cliente.id,
          nome: cliente.nome || '',
          email: cliente.email || '',
          telefone: cliente.telefone || '',
          usuario_id: pedido.usuario_id,
          vendedor_id: pedido.vendedor_id,
          total_gasto: pedido.valor_total
        } : null;
        
        // Retornar pedido no formato VendorOrder
        return {
          id: pedido.id,
          cliente_id: pedido.usuario_id,
          vendedor_id: pedido.vendedor_id,
          valor_total: pedido.valor_total,
          status: pedido.status,
          forma_pagamento: pedido.forma_pagamento,
          endereco_entrega: pedido.endereco_entrega,
          created_at: pedido.created_at,
          data_entrega_estimada: pedido.data_entrega_estimada || null,
          cliente: customerInfo,
          itens: itens || []
        } as VendorOrder;
      }));
      
      // Adicionar pedidos formatados à lista de vendorOrders
      vendorOrders = [...vendorOrders, ...pedidosFormatted];
    }
    
    // Ordenar todos os pedidos por data de criação (mais recentes primeiro)
    vendorOrders.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    console.log(`✅ [fetchDirectVendorOrders] Total de ${vendorOrders.length} pedidos encontrados para o vendedor ${vendorId}`);
    return vendorOrders;
  } catch (error) {
    console.error('🚫 [fetchDirectVendorOrders] Erro ao buscar pedidos:', error);
    return [];
  }
};

/**
 * Versão de depuração para fetchDirectVendorOrders
 * Retorna dados adicionais de diagnóstico
 */
export const fetchDirectVendorOrdersWithDebug = async (
  vendorId: string,
  filters?: OrderFilters,
  includeDetails: boolean = false
): Promise<{ orders: VendorOrder[], debug: any }> => {
  try {
    const orders = await fetchDirectVendorOrders(vendorId, filters);
    
    let debug: any = {
      timestamp: new Date().toISOString(),
      vendorId: vendorId,
      ordersCount: orders.length
    };
    
    if (includeDetails) {
      // Contagem de produtos do vendedor
      const { count: vendorProductsCount, error: productsError } = await supabase
        .from('produtos')
        .select('id', { count: 'exact', head: true })
        .eq('vendedor_id', vendorId);
        
      if (productsError) {
        console.error('🚫 [Debug] Erro ao contar produtos do vendedor:', productsError);
      }
      
      debug.vendorProductsCount = vendorProductsCount || 0;
      
      // Contagem total de itens de pedido relacionados aos produtos do vendedor
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          produto_id,
          produtos!inner(vendedor_id)
        `)
        .eq('produtos.vendedor_id', vendorId);
        
      if (itemsError) {
        console.error('🚫 [Debug] Erro ao buscar itens de pedido:', itemsError);
      }
      
      debug.orderItemsCount = items?.length || 0;
      
      // Contagem de pedidos na tabela pedidos
      const { count: pedidosCount, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('vendedor_id', vendorId);
        
      if (pedidosError) {
        console.error('🚫 [Debug] Erro ao contar pedidos:', pedidosError);
      }
      
      debug.pedidosCount = pedidosCount || 0;
      
      // Status do vendedor
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendedores')
        .select('status')
        .eq('id', vendorId)
        .single();
        
      if (vendorError) {
        console.error('🚫 [Debug] Erro ao buscar status do vendedor:', vendorError);
      }
      
      debug.vendorStatus = vendorData?.status || 'unknown';
    }
    
    return { orders, debug };
  } catch (error) {
    console.error('🚫 [fetchDirectVendorOrdersWithDebug] Erro:', error);
    return { orders: [], debug: { error: error instanceof Error ? error.message : 'Erro desconhecido' } };
  }
};
