
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

      // Buscar o pedido com informações completas
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
          data_entrega_estimada
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

      // Buscar informações dos produtos
      const produtoIds = itens?.map(item => item.produto_id) || [];
      const { data: produtos } = await supabase
        .from('produtos')
        .select('id, nome, imagens')
        .in('id', produtoIds);

      // Criar mapa de produtos
      const produtoMap = new Map(produtos?.map(p => [p.id, p]) || []);

      // Processar itens com informações do produto
      const itensCompletos = itens?.map(item => ({
        ...item,
        produto: produtoMap.get(item.produto_id) || {
          nome: 'Produto não encontrado',
          imagens: []
        }
      })) || [];

      // Buscar informações do cliente com fallbacks
      let clienteInfo = {
        id: pedido.usuario_id,
        vendedor_id: vendorData.id,
        usuario_id: pedido.usuario_id,
        nome: 'Cliente',
        email: '',
        telefone: '',
        total_gasto: 0
      };

      // Tentar buscar do profiles primeiro
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
      } else {
        // Fallback: buscar da tabela clientes_vendedor
        const { data: clienteVendedorData } = await supabase
          .from('clientes_vendedor')
          .select('nome, email, telefone, total_gasto')
          .eq('usuario_id', pedido.usuario_id)
          .eq('vendedor_id', vendorData.id)
          .single();

        if (clienteVendedorData) {
          clienteInfo = {
            ...clienteInfo,
            nome: clienteVendedorData.nome || 'Cliente',
            email: clienteVendedorData.email || '',
            telefone: clienteVendedorData.telefone || '',
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
   * Atualizar status de um pedido
   */
  async updateOrderStatus(pedidoId: string, newStatus: string): Promise<boolean> {
    try {
      console.log(`🔄 [OrderDetailsService] Atualizando status do pedido ${pedidoId} para: ${newStatus}`);
      
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', pedidoId);

      if (error) {
        console.error('❌ [OrderDetailsService] Erro ao atualizar status:', error);
        return false;
      }

      console.log('✅ [OrderDetailsService] Status atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [OrderDetailsService] Erro inesperado:', error);
      return false;
    }
  }
}

export const orderDetailsService = new OrderDetailsService();
