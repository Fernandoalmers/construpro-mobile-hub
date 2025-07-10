
import { supabase } from '@/integrations/supabase/client';
import { Pedido } from './pedidosService';

export class OrderDetailsService {
  
  /**
   * Buscar detalhes completos de um pedido com fallbacks robustos - apenas itens do vendedor logado
   */
  async getOrderDetails(pedidoId: string): Promise<Pedido | null> {
    try {
      console.log(`🔍 [OrderDetailsService] Buscando detalhes do pedido: ${pedidoId}`);
      
      // Validate input
      if (!pedidoId || typeof pedidoId !== 'string') {
        console.error('❌ [OrderDetailsService] ID de pedido inválido:', pedidoId);
        return null;
      }
      
      // Verificar se o usuário tem acesso a este pedido
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ [OrderDetailsService] Erro de autenticação:', authError);
        return null;
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('usuario_id', user.id)
        .single();

      if (vendorError || !vendorData) {
        console.error('❌ [OrderDetailsService] Vendedor não encontrado:', vendorError);
        return null;
      }

      // Primeiro, tentar buscar na tabela pedidos (ID direto)
      let pedido = null;
      const { data: pedidoData, error: pedidoError } = await supabase
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

      if (pedidoData && !pedidoError) {
        pedido = pedidoData;
        console.log('✅ [OrderDetailsService] Pedido encontrado na tabela pedidos:', pedido.id);
      } else {
        // Se não encontrou na tabela pedidos, tentar buscar pelo order_id
        console.log('🔄 [OrderDetailsService] Tentando buscar pelo order_id...');
        const { data: pedidoByOrderId, error: orderIdError } = await supabase
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
          .eq('order_id', pedidoId)
          .eq('vendedor_id', vendorData.id)
          .single();

        if (pedidoByOrderId && !orderIdError) {
          pedido = pedidoByOrderId;
          console.log('✅ [OrderDetailsService] Pedido encontrado pelo order_id:', pedido.id);
        } else {
          console.error('❌ [OrderDetailsService] Pedido não encontrado ou sem permissão:', { 
            pedidoId,
            vendorId: vendorData.id,
            pedidoError: pedidoError?.message,
            orderIdError: orderIdError?.message
          });
          return null;
        }
      }

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

      // Calcular o valor dos produtos do vendedor
      const valorProdutosVendedor = itensCompletos.reduce((sum, item) => {
        return sum + (Number(item.total) || 0);
      }, 0);

      // Calcular frete baseado na zona de entrega e endereço do cliente
      let valorFrete = 0;
      let infoFrete = null;
      
      if (pedido.endereco_entrega && pedido.endereco_entrega.cep) {
        try {
          // Buscar zona de entrega para este vendedor usando a função do banco
          const { data: zones } = await supabase
            .rpc('resolve_delivery_zones', { user_cep: pedido.endereco_entrega.cep });
          
          // Encontrar zona específica para este vendedor
          const vendorZone = zones?.find((zone: any) => zone.vendor_id === vendorData.id);
          
          if (vendorZone) {
            valorFrete = Number(vendorZone.delivery_fee) || 0;
            infoFrete = {
              zone_id: vendorZone.zone_id,
              zone_name: vendorZone.zone_name,
              delivery_time: vendorZone.delivery_time,
              delivery_fee: vendorZone.delivery_fee
            };
            console.log('✅ [OrderDetailsService] Frete calculado:', valorFrete, 'para zona:', vendorZone.zone_name);
          }
        } catch (error) {
          console.log('⚠️ [OrderDetailsService] Erro ao calcular frete:', error);
        }
      }

      // Total do vendedor = produtos + frete
      const valorTotalVendedor = valorProdutosVendedor + valorFrete;

      let clienteInfo = {
        id: pedido.usuario_id,
        vendedor_id: vendorData.id,
        usuario_id: pedido.usuario_id,
        nome: 'Cliente',
        email: '',
        telefone: '',
        total_gasto: 0
      };

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
        valor_total: valorTotalVendedor,
        valor_produtos: valorProdutosVendedor,
        valor_frete: valorFrete,
        info_frete: infoFrete,
        itens: itensCompletos,
        cliente: clienteInfo
      };

      console.log('✅ [OrderDetailsService] Detalhes completos carregados para:', pedido.id, 'Valor vendedor:', valorTotalVendedor);
      return resultado;

    } catch (error) {
      console.error('❌ [OrderDetailsService] Erro inesperado:', error);
      
      // If it's a network error or timeout, throw it for retry
      if (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout')
      )) {
        throw error;
      }
      
      return null;
    }
  }
}

export const orderDetailsService = new OrderDetailsService();
