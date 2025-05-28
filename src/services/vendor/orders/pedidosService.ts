
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
  rastreio?: string;
  created_at: string;
  updated_at?: string;
  data_entrega_estimada?: string;
  itens?: PedidoItem[];
  cliente?: {
    id: string;
    vendedor_id: string;
    usuario_id: string;
    nome: string;
    email: string;
    telefone?: string;
    total_gasto: number;
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
    
    // Buscar pedidos do vendedor na tabela pedidos (sem pontos_ganhos)
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
                imagens: Array.isArray(produtoData.imagens) ? produtoData.imagens : []
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
        
        // Buscar dados do cliente na tabela clientes_vendedor
        const { data: clienteVendorData } = await supabase
          .from('clientes_vendedor')
          .select('id, total_gasto')
          .eq('vendedor_id', vendorData.id)
          .eq('usuario_id', pedido.usuario_id)
          .single();
        
        pedidosCompletos.push({
          ...pedido,
          itens: itensComProdutos,
          cliente: clienteData ? {
            id: clienteVendorData?.id || pedido.usuario_id,
            vendedor_id: vendorData.id,
            usuario_id: pedido.usuario_id,
            nome: clienteData.nome || 'Cliente',
            email: clienteData.email || '',
            telefone: clienteData.telefone,
            total_gasto: clienteVendorData?.total_gasto || 0
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
    
    // Buscar o pedido (sem pontos_ganhos)
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
          imagens: Array.isArray(produtoData.imagens) ? produtoData.imagens : []
        } : undefined
      });
    }
    
    // Buscar dados do cliente na tabela clientes_vendedor
    const { data: clienteVendorData } = await supabase
      .from('clientes_vendedor')
      .select('id, total_gasto')
      .eq('vendedor_id', vendorData.id)
      .eq('usuario_id', pedido.usuario_id)
      .single();
    
    return {
      ...pedido,
      itens: itensComProdutos,
      cliente: cliente ? {
        id: clienteVendorData?.id || pedido.usuario_id,
        vendedor_id: vendorData.id,
        usuario_id: pedido.usuario_id,
        nome: cliente.nome || 'Cliente',
        email: cliente.email || '',
        telefone: cliente.telefone,
        total_gasto: clienteVendorData?.total_gasto || 0
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
    
    // Chamar a função SQL de migração
    const { data, error } = await supabase.rpc('migrate_existing_orders_to_pedidos');
    
    if (error) {
      console.error("❌ [migrateOrdersToPedidos] Erro na migração:", error);
      return { success: false, count: 0, message: "Erro durante a migração: " + error.message };
    }
    
    console.log(`✅ [migrateOrdersToPedidos] Migração concluída: ${data} pedidos migrados`);
    
    return {
      success: true,
      count: data || 0,
      message: `${data || 0} pedidos migrados com sucesso`
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
