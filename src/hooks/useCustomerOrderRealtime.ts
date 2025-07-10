
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useCustomerOrderRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 [useCustomerOrderRealtime] Setting up optimized real-time for customer orders');

    const channel = supabase
      .channel(`customer-orders-optimized-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `cliente_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 [useCustomerOrderRealtime] Orders table updated:', payload);
          const orderId = payload.new?.id;
          
          // Invalidate specific order queries for better performance
          if (orderId) {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
          }
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 [useCustomerOrderRealtime] Pedidos table updated (vendor change):', payload);
          const pedidoId = payload.new?.id;
          const orderId = payload.new?.order_id;
          
          // Invalidate customer queries to reflect vendor changes
          if (orderId) {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
          }
          if (pedidoId) {
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', pedidoId] });
          }
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [useCustomerOrderRealtime] Cleaning up optimized real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
