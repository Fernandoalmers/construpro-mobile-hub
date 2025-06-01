
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
    console.log('🔄 [OrderStatusUpdater] Attempting to update order status via Edge Function:', { id, newInternalStatus });
    
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

    console.log('✅ [OrderStatusUpdater] Permissões verificadas, chamando Edge Function...');
    
    // Obter o status padronizado que será usado
    const standardStatus = STATUS_MAPPING[newInternalStatus.toLowerCase()] || newInternalStatus;
    console.log('🔄 [OrderStatusUpdater] Status padronizado a ser usado:', standardStatus);
    
    // Usar Edge Function para atualização segura
    const { data: functionResult, error: functionError } = await supabase.functions.invoke('update-pedido-status-safe', {
      body: {
        pedido_id: id,
        vendedor_id: vendorData.id,
        new_status: standardStatus,
        order_id_to_update: pedidoCheck.order_id
      }
    });

    if (functionError) {
      console.error('❌ [OrderStatusUpdater] Erro na Edge Function:', functionError);
      toast.error('Erro ao atualizar status: ' + functionError.message);
      return false;
    }

    if (!functionResult?.success) {
      console.error('❌ [OrderStatusUpdater] Edge Function retornou erro:', functionResult);
      toast.error('Erro ao atualizar status: ' + (functionResult?.error || 'Erro desconhecido'));
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Status atualizado com sucesso via Edge Function:', functionResult);
    toast.success(`Status atualizado para "${standardStatus}"`);
    return true;
    
  } catch (error) {
    console.error('❌ [OrderStatusUpdater] Erro inesperado:', error);
    toast.error('Erro inesperado ao atualizar status do pedido');
    return false;
  }
};
