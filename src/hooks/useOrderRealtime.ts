
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOrderRealtime = (referenceId?: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!referenceId) return;

    console.log('🔄 [useOrderRealtime] Setting up real-time listening for reference_id:', referenceId);

    const channel = supabase
      .channel(`order-updates-${referenceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `reference_id=eq.${referenceId}`
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
          filter: `reference_id=eq.${referenceId}`
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
      console.log('🔄 [useOrderRealtime] Cleaning up real-time subscription for:', referenceId);
      supabase.removeChannel(channel);
    };
  }, [referenceId, queryClient]);
};
