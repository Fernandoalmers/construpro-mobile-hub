
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useVendorOrderRealtime = (orderId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !orderId) return;

    console.log('🔄 [useVendorOrderRealtime] Setting up enhanced bidirectional real-time for order:', orderId);

    // Buscar dados do pedido para configuração completa
    const setupRealtimeWithOrderData = async () => {
      const { data: pedidoData } = await supabase
        .from('pedidos')
        .select('order_id, usuario_id')
        .eq('id', orderId)
        .single();

      const orderIdToListen = pedidoData?.order_id;
      const customerUserId = pedidoData?.usuario_id;
      
      console.log('📡 [useVendorOrderRealtime] Setup data:', { 
        pedidoId: orderId, 
        orderId: orderIdToListen, 
        customerId: customerUserId 
      });

      const channel = supabase
        .channel(`vendor-order-enhanced-${orderId}`)
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
            
            // Invalidate vendor queries
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
            queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
            
            // Invalidate customer queries if we have customer data
            if (customerUserId && orderIdToListen) {
              queryClient.invalidateQueries({ queryKey: ['userOrders'] });
              queryClient.invalidateQueries({ queryKey: ['order', orderIdToListen] });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: orderIdToListen ? `id=eq.${orderIdToListen}` : undefined
          },
          (payload) => {
            if (!orderIdToListen) return;
            
            console.log('📡 [useVendorOrderRealtime] Orders table updated:', payload);
            
            // Invalidate all related queries for full sync
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
            queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
            queryClient.invalidateQueries({ queryKey: ['userOrders'] });
            queryClient.invalidateQueries({ queryKey: ['order', orderIdToListen] });
          }
        )
        .subscribe();

      return () => {
        console.log('🔄 [useVendorOrderRealtime] Cleaning up enhanced real-time subscription');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeWithOrderData().catch(error => {
      console.error('❌ [useVendorOrderRealtime] Error setting up real-time:', error);
      return () => {};
    });
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [user?.id, orderId, queryClient]);
};
