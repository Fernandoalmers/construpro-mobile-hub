
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
 * Fetch client information with better error handling and fallbacks
 */
const fetchClientInfo = async (usuario_id: string, vendedor_id: string) => {
  try {
    // First try to get from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .eq('id', usuario_id)
      .single();

    if (profileError) {
      console.log('Could not fetch profile data:', profileError);
    }

    // Try to get vendor-specific customer data
    const { data: clienteVendorData, error: clienteError } = await supabase
      .from('clientes_vendedor')
      .select('id, total_gasto, ultimo_pedido, nome, email, telefone')
      .eq('vendedor_id', vendedor_id)
      .eq('usuario_id', usuario_id)
      .maybeSingle();

    if (clienteError) {
      console.log('Could not fetch client vendor data:', clienteError);
    }

    // Combine data with profile taking precedence, but vendor data for totals
    const clientInfo = {
      id: clienteVendorData?.id || usuario_id,
      vendedor_id: vendedor_id,
      usuario_id: usuario_id,
      nome: profileData?.nome || clienteVendorData?.nome || 'Cliente',
      email: profileData?.email || clienteVendorData?.email || '',
      telefone: profileData?.telefone || clienteVendorData?.telefone || '',
      total_gasto: clienteVendorData?.total_gasto || 0
    };
    
    return clientInfo;
  } catch (error) {
    console.error('Error fetching client info:', error);
    return {
      id: usuario_id,
      vendedor_id: vendedor_id,
      usuario_id: usuario_id,
      nome: 'Cliente',
      email: '',
      telefone: '',
      total_gasto: 0
    };
  }
};

/**
 * Enhanced product data fetching with better image handling
 */
const fetchProductWithImages = async (produto_id: string) => {
  try {
    const { data: produtoData, error: produtoError } = await supabase
      .from('produtos')
      .select('nome, imagens')
      .eq('id', produto_id)
      .single();
    
    if (produtoError) {
      console.error(`Error fetching product ${produto_id}:`, produtoError);
      return null;
    }
    
    if (!produtoData) {
      return null;
    }
    
    // Normalize images to always be an array
    let normalizedImages = [];
    
    if (produtoData.imagens) {
      if (typeof produtoData.imagens === 'string') {
        try {
          // Try to parse if it's a JSON string
          normalizedImages = JSON.parse(produtoData.imagens);
        } catch (e) {
          // If it's a single URL string, wrap it in an array
          normalizedImages = [produtoData.imagens];
        }
      } else if (Array.isArray(produtoData.imagens)) {
        normalizedImages = produtoData.imagens;
      } else {
        // Handle other object types
        normalizedImages = [produtoData.imagens];
      }
    }
    
    const result = {
      nome: produtoData.nome,
      imagens: normalizedImages
    };
    
    return result;
    
  } catch (error) {
    console.error(`Unexpected error for product ${produto_id}:`, error);
    return null;
  }
};

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
        
        // Buscar informações dos produtos com imagens melhoradas
        const itensComProdutos: PedidoItem[] = [];
        if (itens && itens.length > 0) {
          for (const item of itens) {
            const produtoData = await fetchProductWithImages(item.produto_id);
            
            itensComProdutos.push({
              ...item,
              produto: produtoData || { nome: 'Produto não encontrado', imagens: [] }
            });
          }
        }
        
        // Use improved client fetching
        const clienteInfo = await fetchClientInfo(pedido.usuario_id, vendorData.id);
        
        const pedidoCompleto: Pedido = {
          ...pedido,
          itens: itensComProdutos,
          cliente: clienteInfo
        };
        
        pedidosCompletos.push(pedidoCompleto);
        
      } catch (error) {
        console.error(`Erro ao processar pedido ${pedido.id}:`, error);
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
      console.error(`Error fetching pedido:`, error);
      return null;
    }
    
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
    
    // Buscar informações dos produtos com imagens melhoradas
    const itensComProdutos: PedidoItem[] = [];
    if (itens && itens.length > 0) {
      for (const item of itens) {
        const produtoData = await fetchProductWithImages(item.produto_id);
        
        itensComProdutos.push({
          ...item,
          produto: produtoData || { nome: 'Produto não encontrado', imagens: [] }
        });
      }
    }
    
    // Use improved client fetching
    const clienteInfo = await fetchClientInfo(pedido.usuario_id, vendorData.id);
    
    const result = {
      ...pedido,
      itens: itensComProdutos,
      cliente: clienteInfo
    };
    
    return result;
    
  } catch (error) {
    console.error("Error:", error);
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
