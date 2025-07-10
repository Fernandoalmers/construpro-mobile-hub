
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
    id?: string;
    nome: string;
    imagens?: any[];
    imagem_url?: string | null;
    descricao?: string;
    preco_normal?: number;
    sku?: string | null;
    codigo_barras?: string | null;
    unidade_medida?: string;
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
  valor_produtos?: number; // Valor apenas dos produtos do vendedor
  valor_frete?: number; // Valor do frete calculado
  info_frete?: {
    zone_id: string;
    zone_name: string;
    delivery_time: string;
    delivery_fee: number;
  } | null; // Informações da zona de entrega
  cupom_codigo?: string | null;
  desconto_aplicado?: number;
  created_at: string;
  data_entrega_estimada?: string;
  order_id?: string | null; // Novo campo para referenciar orders.id
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
 * Enhanced product data fetching with better image handling
 */
const fetchProductWithImages = async (produto_id: string) => {
  try {
    const { data: produtoData, error: produtoError } = await supabase
      .from('produtos')
      .select('nome, imagens, unidade_medida')
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
      imagens: normalizedImages,
      unidade_medida: produtoData.unidade_medida || 'unidade'
    };
    
    return result;
    
  } catch (error) {
    console.error(`Unexpected error for product ${produto_id}:`, error);
    return null;
  }
};

/**
 * Buscar pedidos de um vendedor específico com otimização
 */
export const getVendorPedidos = async (
  limit: number = 20,
  offset: number = 0,
  statusFilter?: string
): Promise<Pedido[]> => {
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
    
    // Usar consulta direta da tabela pedidos
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select(`
        id,
        usuario_id,
        vendedor_id,
        status,
        forma_pagamento,
        endereco_entrega,
        valor_total,
        cupom_codigo,
        desconto_aplicado,
        created_at,
        order_id
      `)
      .eq('vendedor_id', vendorData.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (pedidosError) {
      console.error('Erro ao buscar pedidos:', pedidosError);
      throw pedidosError;
    }
    
    if (!pedidosData || pedidosData.length === 0) {
      return [];
    }
    
    // Buscar itens dos pedidos de forma otimizada
    const pedidoIds = pedidosData.map(p => p.id);
    const { data: allItems } = await supabase
      .from('itens_pedido')
      .select(`
        id,
        pedido_id,
        produto_id,
        quantidade,
        preco_unitario,
        total,
        created_at
      `)
      .in('pedido_id', pedidoIds);
    
    // Buscar informações dos produtos
    const produtoIds = [...new Set(allItems?.map(item => item.produto_id) || [])];
    const produtoMap = new Map();
    
    for (const produtoId of produtoIds) {
      const produtoData = await fetchProductWithImages(produtoId);
      if (produtoData) {
        produtoMap.set(produtoId, produtoData);
      }
    }
    
    // Buscar informações dos clientes
    const usuarioIds = [...new Set(pedidosData.map(p => p.usuario_id))];
    const { data: clientesData } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone')
      .in('id', usuarioIds);
    
    const clienteMap = new Map(clientesData?.map(c => [c.id, c]) || []);
    
    // Montar os pedidos completos
    const pedidosCompletos: Pedido[] = pedidosData.map(pedido => {
      const itens = allItems?.filter(item => item.pedido_id === pedido.id) || [];
      const itensComProdutos = itens.map(item => ({
        ...item,
        produto: produtoMap.get(item.produto_id) || { nome: 'Produto não encontrado', imagens: [] }
      }));
      
      const clienteData = clienteMap.get(pedido.usuario_id);
      
      return {
        id: pedido.id,
        usuario_id: pedido.usuario_id,
        vendedor_id: pedido.vendedor_id,
        status: pedido.status,
        forma_pagamento: pedido.forma_pagamento,
        endereco_entrega: pedido.endereco_entrega,
        valor_total: pedido.valor_total,
        cupom_codigo: pedido.cupom_codigo,
        desconto_aplicado: pedido.desconto_aplicado || 0,
        created_at: pedido.created_at,
        order_id: pedido.order_id, // Incluir order_id
        itens: itensComProdutos,
        cliente: {
          id: pedido.usuario_id,
          vendedor_id: pedido.vendedor_id,
          usuario_id: pedido.usuario_id,
          nome: clienteData?.nome || 'Cliente',
          email: clienteData?.email || '',
          telefone: clienteData?.telefone || '',
          total_gasto: 0 // Será calculado se necessário
        }
      };
    });
    
    return pedidosCompletos;
    
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    throw error;
  }
};

/**
 * Método fallback caso a função otimizada falhe
 */
const getVendorPedidosFallback = async (vendorId: string, statusFilter?: string): Promise<Pedido[]> => {
  // Buscar pedidos do vendedor na tabela pedidos
  let query = supabase
    .from('pedidos')
    .select(`
      id,
      usuario_id,
      vendedor_id,
      status,
      forma_pagamento,
      endereco_entrega,
      valor_total,
      cupom_codigo,
      desconto_aplicado,
      created_at,
      data_entrega_estimada
    `)
    .eq('vendedor_id', vendorId)
    .order('created_at', { ascending: false });
  
  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }
  
  const { data: pedidos, error: pedidosError } = await query;
  
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
          const produtoData = await fetchProductWithImages(item.produto_id);
          
          itensComProdutos.push({
            ...item,
            produto: produtoData || { nome: 'Produto não encontrado', imagens: [] }
          });
        }
      }
      
      // Buscar informações do cliente
      const { data: clienteData } = await supabase
        .from('profiles')
        .select('nome, email, telefone')
        .eq('id', pedido.usuario_id)
        .single();
      
      const clienteInfo = {
        id: pedido.usuario_id,
        vendedor_id: vendorId,
        usuario_id: pedido.usuario_id,
        nome: clienteData?.nome || 'Cliente',
        email: clienteData?.email || '',
        telefone: clienteData?.telefone || '',
        total_gasto: 0
      };
      
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
    
    // Buscar o pedido com order_id incluído
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
        cupom_codigo,
        desconto_aplicado,
        created_at,
        data_entrega_estimada,
        order_id
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
    
    // Buscar informações dos produtos com imagens
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
    
    // Buscar informações do cliente
    const { data: clienteData } = await supabase
      .from('profiles')
      .select('nome, email, telefone')
      .eq('id', pedido.usuario_id)
      .single();
    
    const clienteInfo = {
      id: pedido.usuario_id,
      vendedor_id: vendorData.id,
      usuario_id: pedido.usuario_id,
      nome: clienteData?.nome || 'Cliente',
      email: clienteData?.email || '',
      telefone: clienteData?.telefone || '',
      total_gasto: 0
    };
    
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
 * Nova função melhorada para migração usando a função do banco
 */
export const migrateOrdersToPedidos = async (): Promise<{ success: boolean; count: number; message: string }> => {
  try {
    // Executar a função SQL de migração melhorada
    const { data, error } = await supabase.rpc('migrate_missing_orders_to_pedidos');
    
    if (error) {
      return { success: false, count: 0, message: "Erro durante a migração: " + error.message };
    }
    
    const count = data || 0;
    
    return {
      success: true,
      count: count,
      message: count > 0 ? `Migração executada com sucesso` : 'Todos os pedidos já estavam sincronizados'
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

/**
 * Nova função para verificar integridade da sincronização
 */
export const checkSyncIntegrity = async () => {
  try {
    const { data, error } = await supabase.rpc('check_sync_integrity');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data?.[0] || null;
  } catch (error) {
    console.error("Erro ao verificar integridade:", error);
    throw error;
  }
};
