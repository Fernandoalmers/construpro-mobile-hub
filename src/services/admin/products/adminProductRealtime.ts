
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Function to configure subscription for realtime product updates
 */
export const subscribeToAdminProductUpdates = (
  callback: (product: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  return supabase
    .channel('admin-products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos'
      },
      (payload) => {
        console.log('Produto atualizado (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new;
        callback(product, eventType);
      }
    )
    .subscribe();
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribeFromChannel = (channel: RealtimeChannel | null): void => {
  if (channel) {
    supabase.removeChannel(channel);
  }
};
