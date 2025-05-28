
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
  created_at: string;
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
    // Obter o vendedor atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    // Buscar o vendedor
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, status')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError || !vendorData) {
      throw new Error('Vendedor não encontrado');
    }
    
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
        created_at,
        data_entrega_estimada
      `)
      .eq('vendedor_id', vendorData.id)
      .order('created_at', { ascending: false });
    
    if (pedidosError) {
      throw new Error('Erro ao buscar pedidos: ' + pedidosError.message);
    }
    
    if (!pedidos || pedidos.length === 0) {
      return [];
    }
    
    // Para cada pedido, buscar os itens e informações do cliente
    const pedidosCompletos: Pedido[] = [];
    
    for (const pedido of pedidos) {
      try {
        // Buscar itens do pedido
        const { data: itens } = await supabase
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
        
        const pedidoCompleto: Pedido = {
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
        };
        
        pedidosCompletos.push(pedidoCompleto);
        
      } catch (error) {
        console.error(`Erro ao processar pedido ${pedido.id}:`, error);
        // Continue processing other orders even if one fails
      }
    }
    
    return pedidosCompletos;
    
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    throw error;
  }
};

/**
 * Buscar um pedido específico por ID
 */
export const getPedidoById = async (pedidoId: string): Promise<Pedido | null> => {
  try {
    // Verificar se o usuário tem acesso a este pedido
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    const { data: vendorData } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (!vendorData) {
      throw new Error('Vendedor não encontrado');
    }
    
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
        created_at,
        data_entrega_estimada
      `)
      .eq('id', pedidoId)
      .eq('vendedor_id', vendorData.id)
      .single();
    
    if (error || !pedido) {
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
    console.error("Erro ao buscar pedido:", error);
    return null;
  }
};

/**
 * Migrar dados existentes da tabela orders para pedidos
 */
export const migrateOrdersToPedidos = async (): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    // Executar a função SQL de migração
    const { data, error } = await supabase.rpc('migrate_orders_to_pedidos');
    
    if (error) {
      return { success: false, count: 0, message: "Erro durante a migração: " + error.message };
    }
    
    const count = data || 0;
    
    return {
      success: true,
      count: count,
      message: `Migração executada com sucesso`
    };
    
  } catch (error) {
    console.error("Erro na migração:", error);
    return {
      success: false,
      count: 0,
      message: "Erro durante a migração"
    };
  }
};
