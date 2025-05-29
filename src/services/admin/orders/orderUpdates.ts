
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from '../../adminService';

export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    // Primeiro tentar na tabela 'orders'
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Log the admin action
      await logAdminAction({
        action: 'update_order_status',
        entityType: 'pedido',
        entityId: orderId,
        details: { status: newStatus }
      });
      
      toast.success('Status do pedido atualizado com sucesso');
      return true;
    } catch (error) {
      console.log('Erro ao atualizar na tabela orders, tentando tabela pedidos:', error);
      
      // Se falhar, tentar na tabela 'pedidos'
      const { error: pedidoError } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (pedidoError) throw pedidoError;
      
      // Log the admin action
      await logAdminAction({
        action: 'update_order_status',
        entityType: 'pedido',
        entityId: orderId,
        details: { status: newStatus }
      });
      
      toast.success('Status do pedido atualizado com sucesso');
      return true;
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};

export const updateTrackingCode = async (orderId: string, trackingCode: string): Promise<boolean> => {
  try {
    // Esta funcionalidade só está disponível na tabela 'orders'
    const { error } = await supabase
      .from('orders')
      .update({ rastreio: trackingCode })
      .eq('id', orderId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'update_tracking_code',
      entityType: 'pedido',
      entityId: orderId,
      details: { rastreio: trackingCode }
    });
    
    toast.success('Código de rastreio atualizado com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating tracking code:', error);
    toast.error('Erro ao atualizar código de rastreio');
    return false;
  }
};
