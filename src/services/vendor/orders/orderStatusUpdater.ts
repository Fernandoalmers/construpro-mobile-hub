
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    console.log('Attempting to update order status:', id, status);
    
    // First try to update in the pedidos table
    let result = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);
    
    if (result.error) {
      console.log('Order not found in pedidos table, trying orders table');
      // If failed, try orders table
      result = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      
      if (result.error) {
        console.error('Error updating order status in orders table:', result.error);
        throw result.error;
      } else {
        console.log('Successfully updated order status in orders table');
      }
    } else {
      console.log('Successfully updated order status in pedidos table');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};
