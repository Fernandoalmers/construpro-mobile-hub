
import { supabase } from '@/integrations/supabase/client';
import { Pedido } from './pedidosService';

export class OrderDetailsService {
  
  /**
   * Buscar detalhes completos de um pedido com fallbacks robustos - apenas itens do vendedor logado
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

      // Buscar o pedido com informações completas incluindo order_id
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
          order_id
        `)
        .eq('id', pedidoId)
        .eq('vendedor_id', vendorData.id)
        .single();

      if (pedidoError || !pedido) {
        console.error('❌ [OrderDetailsService] Erro ao buscar pedido:', pedidoError);
        return null;
      }

      console.log('✅ [OrderDetailsService] Pedido encontrado:', pedido.id);

      // Buscar apenas itens do pedido que pertencem aos produtos deste vendedor
      const { data: itens, error: itensError } = await supabase
        .from('itens_pedido')
        .select(`
          id,
          produto_id,
          quantidade,
          preco_unitario,
          total,
          created_at,
          produtos!inner(
            id,
            nome,
            imagens,
            sku,
            codigo_barras,
            vendedor_id
          )
        `)
        .eq('pedido_id', pedido.id)
        .eq('produtos.vendedor_id', vendorData.id);

      if (itensError) {
        console.error('❌ [OrderDetailsService] Erro ao buscar itens:', itensError);
      }

      // Processar itens com informações completas do produto (incluindo SKU e código de barras)
      const itensCompletos = itens?.map(item => {
        const produto = item.produtos;
        let imageUrl: string | null = null;
        
        if (produto?.imagens && Array.isArray(produto.imagens) && produto.imagens.length > 0) {
          const firstImage = produto.imagens[0];
          if (typeof firstImage === 'string') {
            imageUrl = firstImage;
          } else if (firstImage && typeof firstImage === 'object') {
            const imgObj = firstImage as Record<string, any>;
            imageUrl = imgObj.url || imgObj.path || imgObj.src || null;
          }
        }

        return {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          total: item.total,
          created_at: item.created_at,
          produto: {
            id: produto?.id || item.produto_id,
            nome: produto?.nome || 'Produto não encontrado',
            imagens: Array.isArray(produto?.imagens) ? produto.imagens : 
                     produto?.imagens ? [produto.imagens] : [],
            imagem_url: imageUrl,
            sku: produto?.sku || null,
            codigo_barras: produto?.codigo_barras || null
          }
        };
      }) || [];

      // Recalcular o valor total baseado apenas nos itens do vendedor
      const valorTotalVendedor = itensCompletos.reduce((sum, item) => {
        return sum + (Number(item.total) || 0);
      }, 0);

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
        valor_total: valorTotalVendedor, // Usar valor calculado do vendedor
        itens: itensCompletos,
        cliente: clienteInfo
      };

      console.log('✅ [OrderDetailsService] Detalhes completos carregados para:', pedido.id, 'Valor vendedor:', valorTotalVendedor);
      return resultado;

    } catch (error) {
      console.error('❌ [OrderDetailsService] Erro inesperado:', error);
      return null;
    }
  }
}

export const orderDetailsService = new OrderDetailsService();
