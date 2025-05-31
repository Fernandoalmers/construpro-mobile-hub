
import { supabase } from '@/integrations/supabase/client';
import { Pedido } from './pedidosService';

export class OrderDetailsService {
  
  /**
   * Buscar detalhes completos de um pedido com fallbacks robustos
   */
  async getOrderDetails(pedidoId: string): Promise<Pedido | null> {
    try {
      console.log(`🔍 [OrderDetailsService] Buscando detalhes do pedido: ${pedidoId}`);
      
      // Verificar se o usuário tem acesso a este pedido
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [OrderDetailsService] Usuário não autenticado');
        return null;
      }

      const { data: vendorData } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('usuario_id', user.id)
        .single();

      if (!vendorData) {
        console.error('❌ [OrderDetailsService] Vendedor não encontrado');
        return null;
      }

      // Buscar o pedido com informações completas incluindo reference_id
      const { data: pedido, error: pedidoError } = await supabase
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
          reference_id
        `)
        .eq('id', pedidoId)
        .eq('vendedor_id', vendorData.id)
        .single();

      if (pedidoError || !pedido) {
        console.error('❌ [OrderDetailsService] Erro ao buscar pedido:', pedidoError);
        return null;
      }

      console.log('✅ [OrderDetailsService] Pedido encontrado:', pedido.id);

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
        console.error('❌ [OrderDetailsService] Erro ao buscar itens:', itensError);
      }

      // Buscar informações dos produtos com imagens, SKU, código de barras
      const produtoIds = itens?.map(item => item.produto_id) || [];
      const { data: produtos } = await supabase
        .from('produtos')
        .select('id, nome, imagens, descricao, preco_normal, sku, codigo_barras')
        .in('id', produtoIds);

      // Criar mapa de produtos com conversão de tipos segura
      const produtoMap = new Map(produtos?.map(p => {
        let imageUrl: string | null = null;
        if (p.imagens && Array.isArray(p.imagens) && p.imagens.length > 0) {
          const firstImage = p.imagens[0];
          if (typeof firstImage === 'string') {
            imageUrl = firstImage;
          } else if (firstImage && typeof firstImage === 'object') {
            const imgObj = firstImage as Record<string, any>;
            imageUrl = imgObj.url || imgObj.path || imgObj.src || null;
          }
        }

        return [p.id, {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao || '',
          preco_normal: p.preco_normal,
          sku: p.sku || null,
          codigo_barras: p.codigo_barras || null,
          imagens: Array.isArray(p.imagens) ? p.imagens : 
                   p.imagens ? [p.imagens] : [],
          imagem_url: imageUrl
        }];
      }) || []);

      // Processar itens com informações do produto
      const itensCompletos = itens?.map(item => ({
        ...item,
        produto: produtoMap.get(item.produto_id) || {
          nome: 'Produto não encontrado',
          imagens: [],
          imagem_url: null,
          descricao: '',
          preco_normal: 0,
          sku: null,
          codigo_barras: null
        }
      })) || [];

      // Buscar informações completas do cliente
      let clienteInfo = {
        id: pedido.usuario_id,
        vendedor_id: vendorData.id,
        usuario_id: pedido.usuario_id,
        nome: 'Cliente',
        email: '',
        telefone: '',
        total_gasto: 0
      };

      // Buscar do profiles primeiro (dados mais atualizados)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome, email, telefone')
        .eq('id', pedido.usuario_id)
        .single();

      if (profileData) {
        clienteInfo = {
          ...clienteInfo,
          nome: profileData.nome || 'Cliente',
          email: profileData.email || '',
          telefone: profileData.telefone || ''
        };
      }

      // Se ainda não temos email/telefone, buscar de clientes_vendedor
      if (!clienteInfo.email || !clienteInfo.telefone) {
        const { data: clienteVendedorData } = await supabase
          .from('clientes_vendedor')
          .select('nome, email, telefone, total_gasto')
          .eq('usuario_id', pedido.usuario_id)
          .eq('vendedor_id', vendorData.id)
          .single();

        if (clienteVendedorData) {
          clienteInfo = {
            ...clienteInfo,
            nome: clienteVendedorData.nome || clienteInfo.nome,
            email: clienteVendedorData.email || clienteInfo.email,
            telefone: clienteVendedorData.telefone || clienteInfo.telefone,
            total_gasto: Number(clienteVendedorData.total_gasto) || 0
          };
        }
      }

      const resultado: Pedido = {
        ...pedido,
        itens: itensCompletos,
        cliente: clienteInfo
      };

      console.log('✅ [OrderDetailsService] Detalhes completos carregados para:', pedido.id);
      return resultado;

    } catch (error) {
      console.error('❌ [OrderDetailsService] Erro inesperado:', error);
      return null;
    }
  }

  /**
   * Atualizar status de um pedido usando reference_id para sincronização
   */
  async updateOrderStatus(pedidoId: string, newStatus: string): Promise<boolean> {
    try {
      console.log(`🔄 [OrderDetailsService] Atualizando status do pedido ${pedidoId} para: ${newStatus}`);
      
      // Verificar se o usuário tem acesso a este pedido
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ [OrderDetailsService] Usuário não autenticado');
        return false;
      }

      const { data: vendorData } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('usuario_id', user.id)
        .single();

      if (!vendorData) {
        console.error('❌ [OrderDetailsService] Vendedor não encontrado');
        return false;
      }

      // Verificar se o pedido pertence ao vendedor
      const { data: pedidoCheck } = await supabase
        .from('pedidos')
        .select('vendedor_id, usuario_id, reference_id')
        .eq('id', pedidoId)
        .single();

      if (!pedidoCheck || pedidoCheck.vendedor_id !== vendorData.id) {
        console.error('❌ [OrderDetailsService] Pedido não pertence ao vendedor');
        return false;
      }

      console.log('🔄 [OrderDetailsService] Atualizando status na tabela pedidos...');
      
      // Atualizar o status na tabela pedidos - o trigger irá sincronizar automaticamente
      const { error: pedidosError } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', pedidoId)
        .eq('vendedor_id', vendorData.id);

      if (pedidosError) {
        console.error('❌ [OrderDetailsService] Erro ao atualizar status na tabela pedidos:', pedidosError);
        return false;
      }

      console.log('✅ [OrderDetailsService] Status atualizado com sucesso - sincronização automática ativa');
      return true;
    } catch (error) {
      console.error('❌ [OrderDetailsService] Erro inesperado:', error);
      return false;
    }
  }
}

export const orderDetailsService = new OrderDetailsService();
