
import { supabase } from "@/integrations/supabase/client";

/**
 * Service para trabalhar com a tabela pedidos (específica para vendedores)
 */

export interface PedidoItem {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  created_at: string;
  produto?: {
    nome: string;
    imagens?: any[];
  };
}

export interface Pedido {
  id: string;
  usuario_id: string;
  vendedor_id: string;
  status: string;
  forma_pagamento: string;
  endereco_entrega: any;
  valor_total: number;
  pontos_ganhos?: number;
  rastreio?: string;
  created_at: string;
  updated_at?: string;
  data_entrega_estimada?: string;
  itens?: PedidoItem[];
  cliente?: {
    nome: string;
    email: string;
    telefone?: string;
  };
}

/**
 * Buscar pedidos de um vendedor específico
 */
export const getVendorPedidos = async (): Promise<Pedido[]> => {
  try {
    console.log("🔍 [getVendorPedidos] Buscando pedidos na tabela pedidos");
    
    // Primeiro, obter o vendedor atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("❌ [getVendorPedidos] Usuário não autenticado");
      return [];
    }
    
    // Buscar o vendedor
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, status')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError || !vendorData) {
      console.error("❌ [getVendorPedidos] Vendedor não encontrado:", vendorError);
      return [];
    }
    
    console.log("✅ [getVendorPedidos] Vendedor encontrado:", vendorData.id);
    
    // Buscar pedidos do vendedor na tabela pedidos
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
        pontos_ganhos,
        rastreio,
        created_at,
        updated_at,
        data_entrega_estimada
      `)
      .eq('vendedor_id', vendorData.id)
      .order('created_at', { ascending: false });
    
    if (pedidosError) {
      console.error("❌ [getVendorPedidos] Erro ao buscar pedidos:", pedidosError);
      return [];
    }
    
    console.log(`✅ [getVendorPedidos] Encontrados ${pedidos?.length || 0} pedidos`);
    
    if (!pedidos || pedidos.length === 0) {
      return [];
    }
    
    // Para cada pedido, buscar os itens e informações do cliente
    const pedidosCompletos: Pedido[] = [];
    
    for (const pedido of pedidos) {
      try {
        // Buscar itens do pedido
        const { data: itens, error: itensError } = await supabase
          .from('itens_pedido')
          .select(`
            id,
            produto_id,
            quantidade,
            preco_unitario,
            total,
            created_at
          `)
          .eq('pedido_id', pedido.id);
        
        if (itensError) {
          console.error(`❌ [getVendorPedidos] Erro ao buscar itens do pedido ${pedido.id}:`, itensError);
          continue;
        }
        
        // Buscar informações dos produtos
        const itensComProdutos: PedidoItem[] = [];
        if (itens && itens.length > 0) {
          for (const item of itens) {
            const { data: produtoData } = await supabase
              .from('produtos')
              .select('nome, imagens')
              .eq('id', item.produto_id)
              .single();
            
            itensComProdutos.push({
              ...item,
              produto: produtoData ? {
                nome: produtoData.nome,
                imagens: produtoData.imagens
              } : undefined
            });
          }
        }
        
        // Buscar informações do cliente
        const { data: clienteData } = await supabase
          .from('profiles')
          .select('nome, email, telefone')
          .eq('id', pedido.usuario_id)
          .single();
        
        pedidosCompletos.push({
          ...pedido,
          itens: itensComProdutos,
          cliente: clienteData ? {
            nome: clienteData.nome || 'Cliente',
            email: clienteData.email || '',
            telefone: clienteData.telefone
          } : undefined
        });
        
      } catch (error) {
        console.error(`❌ [getVendorPedidos] Erro ao processar pedido ${pedido.id}:`, error);
      }
    }
    
    console.log(`✅ [getVendorPedidos] Retornando ${pedidosCompletos.length} pedidos completos`);
    return pedidosCompletos;
    
  } catch (error) {
    console.error("❌ [getVendorPedidos] Erro geral:", error);
    return [];
  }
};

/**
 * Buscar um pedido específico por ID
 */
export const getPedidoById = async (pedidoId: string): Promise<Pedido | null> => {
  try {
    // Primeiro verificar se o usuário tem acesso a este pedido
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: vendorData } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (!vendorData) return null;
    
    // Buscar o pedido
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        usuario_id,
        vendedor_id,
        status,
        forma_pagamento,
        endereco_entrega,
        valor_total,
        pontos_ganhos,
        rastreio,
        created_at,
        updated_at,
        data_entrega_estimada
      `)
      .eq('id', pedidoId)
      .eq('vendedor_id', vendorData.id)
      .single();
    
    if (error || !pedido) {
      console.error("❌ [getPedidoById] Pedido não encontrado:", error);
      return null;
    }
    
    // Buscar itens e cliente do pedido
    const [itensResult, clienteResult] = await Promise.all([
      supabase
        .from('itens_pedido')
        .select(`
          id,
          produto_id,
          quantidade,
          preco_unitario,
          total,
          created_at
        `)
        .eq('pedido_id', pedido.id),
      supabase
        .from('profiles')
        .select('nome, email, telefone')
        .eq('id', pedido.usuario_id)
        .single()
    ]);
    
    const itens = itensResult.data || [];
    const cliente = clienteResult.data;
    
    // Buscar informações dos produtos
    const itensComProdutos: PedidoItem[] = [];
    for (const item of itens) {
      const { data: produtoData } = await supabase
        .from('produtos')
        .select('nome, imagens')
        .eq('id', item.produto_id)
        .single();
      
      itensComProdutos.push({
        ...item,
        produto: produtoData ? {
          nome: produtoData.nome,
          imagens: produtoData.imagens
        } : undefined
      });
    }
    
    return {
      ...pedido,
      itens: itensComProdutos,
      cliente: cliente ? {
        nome: cliente.nome || 'Cliente',
        email: cliente.email || '',
        telefone: cliente.telefone
      } : undefined
    };
    
  } catch (error) {
    console.error("❌ [getPedidoById] Erro:", error);
    return null;
  }
};

/**
 * Migrar dados existentes da tabela orders para pedidos
 */
export const migrateOrdersToPedidos = async (): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    console.log("🔄 [migrateOrdersToPedidos] Iniciando migração manual");
    
    // Primeiro, limpar dados existentes na tabela pedidos
    await supabase.from('itens_pedido').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Buscar todos os pedidos da tabela orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at');
    
    if (ordersError || !orders) {
      console.error("❌ [migrateOrdersToPedidos] Erro ao buscar orders:", ordersError);
      return { success: false, count: 0, message: "Erro ao buscar pedidos originais" };
    }
    
    console.log(`📦 [migrateOrdersToPedidos] Encontrados ${orders.length} pedidos para migrar`);
    
    let migratedCount = 0;
    
    for (const order of orders) {
      try {
        // Buscar itens do pedido
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        
        if (!orderItems || orderItems.length === 0) {
          console.log(`⚠️ [migrateOrdersToPedidos] Pedido ${order.id} sem itens, pulando`);
          continue;
        }
        
        // Agrupar itens por vendedor
        const vendorGroups: { [vendorId: string]: any[] } = {};
        
        for (const item of orderItems) {
          const { data: produto } = await supabase
            .from('produtos')
            .select('vendedor_id')
            .eq('id', item.produto_id)
            .single();
          
          if (produto?.vendedor_id) {
            if (!vendorGroups[produto.vendedor_id]) {
              vendorGroups[produto.vendedor_id] = [];
            }
            vendorGroups[produto.vendedor_id].push(item);
          }
        }
        
        // Criar um pedido para cada vendedor
        for (const [vendorId, items] of Object.entries(vendorGroups)) {
          const vendorTotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
          const vendorPoints = order.valor_total > 0 
            ? Math.round((vendorTotal * order.pontos_ganhos) / order.valor_total)
            : 0;
          
          // Inserir pedido
          const { data: novoPedido, error: pedidoError } = await supabase
            .from('pedidos')
            .insert({
              usuario_id: order.cliente_id,
              vendedor_id: vendorId,
              status: order.status,
              forma_pagamento: order.forma_pagamento,
              endereco_entrega: order.endereco_entrega,
              valor_total: vendorTotal,
              pontos_ganhos: vendorPoints,
              rastreio: order.rastreio,
              created_at: order.created_at,
              updated_at: order.updated_at,
              data_entrega_estimada: new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();
          
          if (pedidoError || !novoPedido) {
            console.error(`❌ [migrateOrdersToPedidos] Erro ao criar pedido para vendedor ${vendorId}:`, pedidoError);
            continue;
          }
          
          // Inserir itens do pedido
          const itensParaInserir = items.map(item => ({
            pedido_id: novoPedido.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            total: item.subtotal,
            created_at: item.created_at
          }));
          
          const { error: itensError } = await supabase
            .from('itens_pedido')
            .insert(itensParaInserir);
          
          if (itensError) {
            console.error(`❌ [migrateOrdersToPedidos] Erro ao inserir itens:`, itensError);
          } else {
            console.log(`✅ [migrateOrdersToPedidos] Migrado pedido ${order.id} para vendedor ${vendorId}`);
            migratedCount++;
          }
        }
        
      } catch (error) {
        console.error(`❌ [migrateOrdersToPedidos] Erro ao processar pedido ${order.id}:`, error);
      }
    }
    
    console.log(`✅ [migrateOrdersToPedidos] Migração concluída: ${migratedCount} pedidos migrados`);
    
    return {
      success: true,
      count: migratedCount,
      message: `${migratedCount} pedidos migrados com sucesso`
    };
    
  } catch (error) {
    console.error("❌ [migrateOrdersToPedidos] Erro geral:", error);
    return {
      success: false,
      count: 0,
      message: "Erro durante a migração"
    };
  }
};
