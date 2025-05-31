
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useCustomerOrderRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 [useCustomerOrderRealtime] Setting up real-time listening for customer orders');

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `cliente_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 [useCustomerOrderRealtime] Order status updated:', payload);
          // Invalidate customer order queries
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
          queryClient.invalidateQueries({ queryKey: ['order'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('📡 [useCustomerOrderRealtime] Pedido status updated:', payload);
          // Check if this pedido affects the current user's orders
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
          queryClient.invalidateQueries({ queryKey: ['order'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [useCustomerOrderRealtime] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
