
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useCustomerOrderRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 [useCustomerOrderRealtime] Setting up enhanced real-time for customer orders');

    const channel = supabase
      .channel(`customer-orders-enhanced-${user.id}`)
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
          console.log('📡 [useCustomerOrderRealtime] Pedidos table updated:', payload);
          // Invalidate customer queries to reflect vendor changes
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
          queryClient.invalidateQueries({ queryKey: ['order'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [useCustomerOrderRealtime] Cleaning up enhanced real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
