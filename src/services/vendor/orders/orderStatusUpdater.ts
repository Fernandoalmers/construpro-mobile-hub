
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const updateOrderStatus = async (id: string, newInternalStatus: string): Promise<boolean> => {
  try {
    console.log('🔄 [OrderStatusUpdater] Iniciando atualização de status:', { 
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

    console.log('👤 [OrderStatusUpdater] Usuário autenticado:', {
      userId: user.id,
      email: user.email
    });

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
      .select('vendedor_id, usuario_id, status')
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
      current_status: pedidoCheck.status,
      new_status: newInternalStatus,
      usuario_id: pedidoCheck.usuario_id
    });

    if (pedidoCheck.vendedor_id !== vendorData.id) {
      console.error('❌ [OrderStatusUpdater] Permissão negada:', {
        pedido_vendor: pedidoCheck.vendedor_id,
        user_vendor: vendorData.id
      });
      toast.error('Você não tem permissão para alterar este pedido');
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Permissões verificadas, chamando Edge Function...');
    
    // Preparar payload para Edge Function
    const functionPayload = {
      pedido_id: id,
      vendedor_id: vendorData.id,
      new_status: newInternalStatus
    };

    console.log('📡 [OrderStatusUpdater] Payload da Edge Function:', JSON.stringify(functionPayload, null, 2));
    
    // Chamada para Edge Function (Simplificada - apenas tabela pedidos)
    console.log('📞 [OrderStatusUpdater] Invocando Edge Function update-pedido-status-safe...');
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('update-pedido-status-safe', {
      body: functionPayload
    });

    console.log('📥 [OrderStatusUpdater] Resposta da Edge Function:', {
      functionResult,
      functionError,
      hasData: !!functionResult,
      hasError: !!functionError,
      resultType: typeof functionResult,
      resultSuccess: functionResult?.success,
      resultError: functionResult?.error,
      resultStep: functionResult?.step
    });

    if (functionError) {
      console.error('❌ [OrderStatusUpdater] Erro da Edge Function:', {
        error: functionError,
        message: functionError.message,
        context: functionError.context,
        status: functionError.status
      });
      
      // Mensagem de erro mais específica baseada no step
      let errorMessage = 'Erro ao atualizar status do pedido';
      
      if (functionError.message) {
        if (functionError.message.includes('environment')) {
          errorMessage = 'Erro de configuração do servidor. Contate o suporte.';
        } else if (functionError.message.includes('permission') || functionError.message.includes('Acesso negado')) {
          errorMessage = 'Sem permissão para alterar este pedido.';
        } else if (functionError.message.includes('not found') || functionError.message.includes('não encontrado')) {
          errorMessage = 'Pedido não encontrado.';
        } else if (functionError.message.includes('JSON')) {
          errorMessage = 'Erro de comunicação. Tente novamente.';
        } else if (functionError.message.includes('Status inválido')) {
          errorMessage = `Status inválido: ${newInternalStatus}. Use: pendente, confirmado, processando, enviado, entregue, cancelado`;
        } else {
          errorMessage = `Erro: ${functionError.message}`;
        }
      }
      
      toast.error(errorMessage);
      return false;
    }

    if (!functionResult?.success) {
      console.error('❌ [OrderStatusUpdater] Edge Function retornou erro:', functionResult);
      const errorMsg = functionResult?.error || functionResult?.message || 'Erro desconhecido na atualização';
      const step = functionResult?.step || 'unknown';
      console.error('❌ [OrderStatusUpdater] Erro no step:', step);
      
      // Tratar erros específicos baseados no step
      let userMessage = errorMsg;
      if (step === 'validate_status') {
        userMessage = `Status inválido: ${newInternalStatus}. Use apenas: pendente, confirmado, processando, enviado, entregue, cancelado`;
      } else if (step === 'check_permissions') {
        userMessage = 'Sem permissão para alterar este pedido';
      } else if (step === 'check_pedido_exists') {
        userMessage = 'Pedido não encontrado';
      }
      
      toast.error(`Erro ao atualizar status: ${userMessage}`);
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Status atualizado com sucesso:', functionResult);
    
    // Exibir nota sobre simplificação se presente
    if (functionResult.note) {
      console.log('ℹ️ [OrderStatusUpdater] Nota:', functionResult.note);
    }
    
    toast.success(`Status atualizado para "${newInternalStatus}"`);
    return true;
    
  } catch (error) {
    console.error('❌ [OrderStatusUpdater] Erro inesperado:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
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
