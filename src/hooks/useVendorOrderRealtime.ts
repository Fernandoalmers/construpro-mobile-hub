
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVendorOrderRealtime = (orderId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !orderId) return;

    console.log('🔄 [useVendorOrderRealtime] Setting up bidirectional real-time for order:', orderId);

    // Buscar o order_id do pedido para usar na sincronização
    const setupRealtimeWithOrderId = async () => {
      const { data: pedidoData } = await supabase
        .from('pedidos')
        .select('order_id')
        .eq('id', orderId)
        .single();

      const orderIdToListen = pedidoData?.order_id || orderId;
      
      console.log('📡 [useVendorOrderRealtime] Listening to order_id:', orderIdToListen);

      const channel = supabase
        .channel(`vendor-order-sync-${orderIdToListen}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pedidos',
            filter: `id=eq.${orderId}`
          },
          (payload) => {
            console.log('📡 [useVendorOrderRealtime] Pedidos table updated:', payload);
            // Invalidate vendor order queries
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
            queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderIdToListen}`
          },
          (payload) => {
            console.log('📡 [useVendorOrderRealtime] Orders table updated:', payload);
            // Invalidate both vendor and customer queries for full sync
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
            queryClient.invalidateQueries({ queryKey: ['userOrders'] });
            queryClient.invalidateQueries({ queryKey: ['order'] });
          }
        )
        .subscribe();

      return () => {
        console.log('🔄 [useVendorOrderRealtime] Cleaning up bidirectional real-time subscription');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeWithOrderId();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user?.id, orderId, queryClient]);
};
