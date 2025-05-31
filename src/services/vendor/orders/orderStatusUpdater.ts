
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Mapeamento de status entre pedidos (interno) e orders (database constraint)
const STATUS_MAPPING = {
  'pendente': 'Confirmado',
  'confirmado': 'Em Separação', 
  'processando': 'Em Separação',
  'enviado': 'Em Trânsito',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado'
};

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    console.log('🔄 [OrderStatusUpdater] Attempting to update order status:', { id, status });
    
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
      novo_status: status
    });

    if (pedidoCheck.vendedor_id !== vendorData.id) {
      console.error('❌ [OrderStatusUpdater] Pedido não pertence ao vendedor:', {
        pedido_vendedor: pedidoCheck.vendedor_id,
        usuario_vendedor: vendorData.id
      });
      toast.error('Você não tem permissão para alterar este pedido');
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Permissões verificadas, atualizando status...');
    
    // Atualizar o status na tabela pedidos
    const { error: pedidosError } = await supabase
      .from('pedidos')
      .update({ status: status })
      .eq('id', id)
      .eq('vendedor_id', vendorData.id);

    if (pedidosError) {
      console.error('❌ [OrderStatusUpdater] Erro ao atualizar status na tabela pedidos:', pedidosError);
      toast.error('Erro ao atualizar status do pedido: ' + pedidosError.message);
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Status atualizado na tabela pedidos');

    // Se existe order_id, também atualizar na tabela orders para sincronização
    if (pedidoCheck.order_id) {
      console.log('🔄 [OrderStatusUpdater] Sincronizando com tabela orders...');
      
      // Mapear o status interno para o valor aceito pela constraint da tabela orders
      const mappedStatus = STATUS_MAPPING[status.toLowerCase()] || status;
      console.log('🔀 [OrderStatusUpdater] Mapeando status:', { 
        original: status, 
        mapped: mappedStatus 
      });
      
      const { error: ordersError } = await supabase
        .from('orders')
        .update({ status: mappedStatus })
        .eq('id', pedidoCheck.order_id);

      if (ordersError) {
        console.warn('⚠️ [OrderStatusUpdater] Aviso: Erro ao sincronizar com tabela orders:', ordersError);
        // Não falhar se a sincronização der erro, pois o principal (pedidos) foi atualizado
      } else {
        console.log('✅ [OrderStatusUpdater] Sincronizado com tabela orders usando status:', mappedStatus);
      }
    }

    console.log('✅ [OrderStatusUpdater] Status atualizado com sucesso de', pedidoCheck.status, 'para', status);
    toast.success(`Status atualizado de "${pedidoCheck.status}" para "${status}"`);
    return true;
  } catch (error) {
    console.error('❌ [OrderStatusUpdater] Erro inesperado:', error);
    toast.error('Erro inesperado ao atualizar status do pedido');
    return false;
  }
};
