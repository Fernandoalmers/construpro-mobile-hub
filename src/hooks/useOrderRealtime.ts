
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOrderRealtime = (orderId?: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    console.log('🔄 [useOrderRealtime] Setting up real-time listening for order_id:', orderId);

    const channel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('📡 [useOrderRealtime] Real-time update received for pedidos:', payload);
          // Invalidate all order-related queries
          queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails'] });
          queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('📡 [useOrderRealtime] Real-time update received for orders:', payload);
          // Invalidate all order-related queries
          queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails'] });
          queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [useOrderRealtime] Cleaning up real-time subscription for:', orderId);
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);
};
