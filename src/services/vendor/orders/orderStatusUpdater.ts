
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    console.log('🔄 [OrderStatusUpdater] Attempting to update order status:', id, status);
    
    // Verificar se o usuário tem acesso a este pedido
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ [OrderStatusUpdater] Usuário não autenticado');
      return false;
    }

    const { data: vendorData } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .eq('usuario_id', user.id)
      .single();

    if (!vendorData) {
      console.error('❌ [OrderStatusUpdater] Vendedor não encontrado');
      return false;
    }

    // Verificar se o pedido pertence ao vendedor
    const { data: pedidoCheck } = await supabase
      .from('pedidos')
      .select('vendedor_id, usuario_id, order_id')
      .eq('id', id)
      .single();

    if (!pedidoCheck || pedidoCheck.vendedor_id !== vendorData.id) {
      console.error('❌ [OrderStatusUpdater] Pedido não pertence ao vendedor');
      return false;
    }

    console.log('🔄 [OrderStatusUpdater] Atualizando status na tabela pedidos (sync automático ativo)...');
    
    // Atualizar o status na tabela pedidos - o trigger irá sincronizar automaticamente
    const { error: pedidosError } = await supabase
      .from('pedidos')
      .update({ status: status })
      .eq('id', id)
      .eq('vendedor_id', vendorData.id);

    if (pedidosError) {
      console.error('❌ [OrderStatusUpdater] Erro ao atualizar status na tabela pedidos:', pedidosError);
      return false;
    }

    console.log('✅ [OrderStatusUpdater] Status atualizado com sucesso - sincronização automática ativa');
    toast.success('Status do pedido atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [OrderStatusUpdater] Erro inesperado:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};
