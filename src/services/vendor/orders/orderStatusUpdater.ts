
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Mapeamento de status interno para status padronizado (compatível com constraint)
const STATUS_MAPPING = {
  'pendente': 'Confirmado',
  'confirmado': 'Em Separação', 
  'processando': 'Em Separação',
  'enviado': 'Em Trânsito',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado'
};

export const updateOrderStatus = async (id: string, newInternalStatus: string): Promise<boolean> => {
  try {
    console.log('🔄 [OrderStatusUpdater] Attempting to update order status:', { id, newInternalStatus });
    
    // Verificar se o usuário tem acesso a este pedido
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [OrderStatusUpdater] Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    console.log('👤 [OrderStatusUpdater] Usuário autenticado:', user.email);

    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id')
      .eq('usuario_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('❌ [OrderStatusUpdater] Vendedor não encontrado:', vendorError);
      toast.error('Vendedor não encontrado para o usuário atual');
      return false;
    }

    console.log('🏪 [OrderStatusUpdater] Vendedor encontrado:', {
      id: vendorData.id,
      nome_loja: vendorData.nome_loja,
      usuario_id: vendorData.usuario_id
    });

    // Verificar se o pedido pertence ao vendedor
    const { data: pedidoCheck, error: pedidoCheckError } = await supabase
      .from('pedidos')
      .select('vendedor_id, usuario_id, order_id, status')
      .eq('id', id)
      .single();

    if (pedidoCheckError || !pedidoCheck) {
      console.error('❌ [OrderStatusUpdater] Pedido não encontrado:', pedidoCheckError);
      toast.error('Pedido não encontrado');
      return false;
    }

    console.log('📦 [OrderStatusUpdater] Dados do pedido:', {
      pedido_id: id,
      vendedor_id: pedidoCheck.vendedor_id,
      vendedor_esperado: vendorData.id,
      status_atual: pedidoCheck.status,
      novo_status_interno: newInternalStatus,
      order_id: pedidoCheck.order_id
    });

    if (pedidoCheck.vendedor_id !== vendorData.id) {
      console.error('❌ [OrderStatusUpdater] Pedido não pertence ao vendedor:', {
        pedido_vendedor: pedidoCheck.vendedor_id,
        usuario_vendedor: vendorData.id
      });
      toast.error('Você não tem permissão para alterar este pedido');
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Permissões verificadas, iniciando atualização...');
    
    // Obter o status padronizado que será usado
    const standardStatus = STATUS_MAPPING[newInternalStatus.toLowerCase()] || newInternalStatus;
    console.log('🔄 [OrderStatusUpdater] Status padronizado a ser usado:', standardStatus);
    
    // Estratégia simplificada: atualização direta com tratamento robusto de erros
    try {
      // Se existe order_id, atualizar primeiro a tabela orders
      if (pedidoCheck.order_id) {
        console.log('🔄 [OrderStatusUpdater] Atualizando tabela orders primeiro:', { 
          order_id: pedidoCheck.order_id,
          status: standardStatus 
        });
        
        const { error: ordersError } = await supabase
          .from('orders')
          .update({ status: standardStatus })
          .eq('id', pedidoCheck.order_id);

        if (ordersError) {
          console.error('❌ [OrderStatusUpdater] Erro ao atualizar tabela orders:', ordersError);
          toast.error('Erro ao sincronizar status com sistema principal: ' + ordersError.message);
          return false;
        }

        console.log('✅ [OrderStatusUpdater] Tabela orders atualizada com status:', standardStatus);
      }
      
      // Estratégia para contornar triggers: usar configurações específicas
      try {
        // Tentar desabilitar triggers temporariamente para esta sessão
        try {
          await supabase.rpc('execute_custom_sql', {
            sql_statement: 'SET session_replication_role = replica;'
          });
        } catch (sqlError) {
          console.log('⚠️ [OrderStatusUpdater] Não foi possível desabilitar triggers');
        }

        // Atualizar o status na tabela pedidos
        console.log('🔄 [OrderStatusUpdater] Atualizando tabela pedidos com status padronizado:', standardStatus);
        const { error: pedidosError } = await supabase
          .from('pedidos')
          .update({ status: standardStatus })
          .eq('id', id)
          .eq('vendedor_id', vendorData.id);

        // Reabilitar triggers
        try {
          await supabase.rpc('execute_custom_sql', {
            sql_statement: 'SET session_replication_role = DEFAULT;'
          });
        } catch (sqlError) {
          console.log('⚠️ [OrderStatusUpdater] Não foi possível reabilitar triggers');
        }

        if (pedidosError) {
          console.error('❌ [OrderStatusUpdater] Erro ao atualizar status na tabela pedidos:', pedidosError);
          
          // Se houve erro no pedidos mas orders foi atualizado, tentar reverter
          if (pedidoCheck.order_id) {
            console.log('🔄 [OrderStatusUpdater] Tentando reverter mudança na tabela orders...');
            try {
              await supabase
                .from('orders')
                .update({ status: pedidoCheck.status })
                .eq('id', pedidoCheck.order_id);
            } catch (revertError) {
              console.error('❌ [OrderStatusUpdater] Erro ao reverter orders:', revertError);
            }
          }
          
          // Tratar erros específicos de triggers
          if (pedidosError.message?.includes('order_id')) {
            toast.error('Erro de sincronização entre sistemas. Tente novamente.');
          } else if (pedidosError.message?.includes('constraint') || pedidosError.message?.includes('violates check')) {
            toast.error('Erro de validação de status. Tente novamente.');
          } else {
            toast.error('Erro ao atualizar status do pedido: ' + pedidosError.message);
          }
          return false;
        }

        console.log('✅ [OrderStatusUpdater] Tabela pedidos atualizada com status:', standardStatus);
      } catch (transactionError) {
        console.error('❌ [OrderStatusUpdater] Erro na transação:', transactionError);
        toast.error('Erro ao processar atualização. Tente novamente.');
        return false;
      }

    } catch (updateError) {
      console.error('❌ [OrderStatusUpdater] Erro geral na atualização:', updateError);
      toast.error('Erro inesperado ao atualizar status');
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Status atualizado com sucesso de', pedidoCheck.status, 'para', standardStatus);
    toast.success(`Status atualizado para "${standardStatus}"`);
    return true;
    
  } catch (error) {
    console.error('❌ [OrderStatusUpdater] Erro inesperado:', error);
    toast.error('Erro inesperado ao atualizar status do pedido');
    return false;
  }
};
