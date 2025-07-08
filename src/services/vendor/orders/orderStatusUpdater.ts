
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Mapeamento de status interno para status padronizado
const STATUS_MAPPING = {
  'pendente': 'confirmado',
  'confirmado': 'processando', 
  'processando': 'enviado',
  'enviado': 'entregue',
  'entregue': 'entregue', // já finalizado
  'cancelado': 'cancelado' // já finalizado
};

export const updateOrderStatus = async (id: string, newInternalStatus: string): Promise<boolean> => {
  try {
    console.log('🔄 [OrderStatusUpdater] Starting status update:', { 
      pedido_id: id, 
      new_status: newInternalStatus 
    });
    
    // Verificar se o usuário tem acesso a este pedido
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [OrderStatusUpdater] Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    console.log('👤 [OrderStatusUpdater] User authenticated:', user.email);

    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id')
      .eq('usuario_id', user.id)
      .single();

    if (vendorError || !vendorData) {
      console.error('❌ [OrderStatusUpdater] Vendor not found:', vendorError);
      toast.error('Vendedor não encontrado para o usuário atual');
      return false;
    }

    console.log('🏪 [OrderStatusUpdater] Vendor found:', {
      id: vendorData.id,
      nome_loja: vendorData.nome_loja
    });

    // Verificar se o pedido pertence ao vendedor
    const { data: pedidoCheck, error: pedidoCheckError } = await supabase
      .from('pedidos')
      .select('vendedor_id, usuario_id, order_id, status')
      .eq('id', id)
      .single();

    if (pedidoCheckError || !pedidoCheck) {
      console.error('❌ [OrderStatusUpdater] Pedido not found:', pedidoCheckError);
      toast.error('Pedido não encontrado');
      return false;
    }

    console.log('📦 [OrderStatusUpdater] Pedido data:', {
      pedido_id: id,
      vendedor_id: pedidoCheck.vendedor_id,
      current_status: pedidoCheck.status,
      new_status: newInternalStatus,
      order_id: pedidoCheck.order_id
    });

    if (pedidoCheck.vendedor_id !== vendorData.id) {
      console.error('❌ [OrderStatusUpdater] Permission denied:', {
        pedido_vendor: pedidoCheck.vendedor_id,
        user_vendor: vendorData.id
      });
      toast.error('Você não tem permissão para alterar este pedido');
      return false;
    }

    // Validar transição de status
    const currentStatus = pedidoCheck.status.toLowerCase();
    const finalStatuses = ['entregue', 'cancelado'];
    
    if (finalStatuses.includes(currentStatus)) {
      console.error('❌ [OrderStatusUpdater] Cannot update final status:', currentStatus);
      toast.error('Não é possível alterar o status de um pedido finalizado');
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Permissions verified, calling Edge Function...');
    
    // Chamada para Edge Function com dados validados
    const functionPayload = {
      pedido_id: id,
      vendedor_id: vendorData.id,
      new_status: newInternalStatus,
      order_id_to_update: pedidoCheck.order_id
    };

    console.log('📡 [OrderStatusUpdater] Calling Edge Function with payload:', functionPayload);
    
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('update-pedido-status-safe', {
      body: functionPayload
    });

    if (functionError) {
      console.error('❌ [OrderStatusUpdater] Edge Function error:', {
        error: functionError,
        message: functionError.message,
        context: functionError.context
      });
      
      // Tentar extrair uma mensagem de erro mais específica
      let errorMessage = 'Erro ao atualizar status do pedido';
      if (functionError.message) {
        if (functionError.message.includes('constraint')) {
          errorMessage = 'Erro de validação de status. Verifique se a transição é válida.';
        } else if (functionError.message.includes('permission')) {
          errorMessage = 'Sem permissão para alterar este pedido.';
        } else if (functionError.message.includes('not found')) {
          errorMessage = 'Pedido não encontrado.';
        } else {
          errorMessage = `Erro: ${functionError.message}`;
        }
      }
      
      toast.error(errorMessage);
      return false;
    }

    if (!functionResult?.success) {
      console.error('❌ [OrderStatusUpdater] Edge Function returned error:', functionResult);
      const errorMsg = functionResult?.error || functionResult?.message || 'Erro desconhecido na atualização';
      toast.error(`Erro ao atualizar status: ${errorMsg}`);
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Status updated successfully:', functionResult);
    toast.success(`Status atualizado para "${newInternalStatus}"`);
    return true;
    
  } catch (error) {
    console.error('❌ [OrderStatusUpdater] Unexpected error:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    
    let errorMessage = 'Erro inesperado ao atualizar status do pedido';
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Tempo limite excedido. Tente novamente.';
      } else {
        errorMessage = `Erro: ${error.message}`;
      }
    }
    
    toast.error(errorMessage);
    return false;
  }
};
