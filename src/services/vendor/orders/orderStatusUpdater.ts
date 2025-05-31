
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const updateOrderStatus = async (id: string, status: string): Promise<boolean> => {
  try {
    console.log('Attempting to update order status:', id, status);
    
    // Update in the pedidos table (vendor side)
    const { error: pedidosError } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id);
    
    if (pedidosError) {
      console.error('Error updating order status in pedidos table:', pedidosError);
      throw pedidosError;
    }
    
    console.log('Successfully updated order status in pedidos table - sync will handle orders table');
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Erro ao atualizar status do pedido');
    return false;
  }
};
