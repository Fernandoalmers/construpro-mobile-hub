import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook global para sincronização em tempo real de pedidos
 * Usado tanto por vendedores quanto por clientes
 */
export const useOrderRealtimeSync = (config?: {
  orderId?: string;
  pedidoId?: string; 
  mode?: 'vendor' | 'customer' | 'global';
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { orderId, pedidoId, mode = 'global' } = config || {};

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 [useOrderRealtimeSync] Setting up global real-time sync:', { mode, orderId, pedidoId });

    // Canal único baseado no usuário e configuração
    const channelName = `order-sync-${user.id}-${mode}-${orderId || pedidoId || 'all'}`;
    
    const channel = supabase.channel(channelName);

    // Configurar listeners baseados no modo
    if (mode === 'customer' || mode === 'global') {
      // Escutar mudanças na tabela orders para clientes
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: orderId ? `id=eq.${orderId}` : `cliente_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 [useOrderRealtimeSync] Orders updated (customer):', payload);
          const updatedOrderId = payload.new?.id;
          
          if (updatedOrderId) {
            queryClient.invalidateQueries({ queryKey: ['order', updatedOrderId] });
          }
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        }
      );

      // Escutar mudanças na tabela pedidos que afetam o cliente
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: pedidoId ? `id=eq.${pedidoId}` : `usuario_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 [useOrderRealtimeSync] Pedidos updated (customer impact):', payload);
          const updatedOrderId = payload.new?.order_id;
          const updatedPedidoId = payload.new?.id;
          
          if (updatedOrderId) {
            queryClient.invalidateQueries({ queryKey: ['order', updatedOrderId] });
          }
          if (updatedPedidoId) {
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', updatedPedidoId] });
          }
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        }
      );
    }

    if (mode === 'vendor' || mode === 'global') {
      // Escutar mudanças de pedidos para vendedores
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: pedidoId ? `id=eq.${pedidoId}` : undefined
        },
        (payload) => {
          console.log('📡 [useOrderRealtimeSync] Pedidos updated (vendor):', payload);
          const updatedPedidoId = payload.new?.id;
          const updatedOrderId = payload.new?.order_id;
          
          if (updatedPedidoId) {
            queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', updatedPedidoId] });
          }
          if (updatedOrderId) {
            queryClient.invalidateQueries({ queryKey: ['order', updatedOrderId] });
          }
          queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        }
      );
    }

    // Inscrever no canal
    channel.subscribe((status) => {
      console.log('📡 [useOrderRealtimeSync] Channel status:', status);
    });

    return () => {
      console.log('🔄 [useOrderRealtimeSync] Cleaning up global sync subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, orderId, pedidoId, mode, queryClient]);
};