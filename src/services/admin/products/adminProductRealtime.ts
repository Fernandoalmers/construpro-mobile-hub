
import { supabase } from '@/integrations/supabase/client';
import { AdminProduct } from '@/types/admin';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to admin product updates in realtime
 */
export const subscribeToAdminProductUpdates = (
  callback: (product: AdminProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): RealtimeChannel => {
  return supabase
    .channel('admin-product-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos',
      },
      (payload) => {
        console.log('Product realtime update:', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new as any;
        callback(product, eventType);
      }
    )
    .subscribe();
};

/**
 * Unsubscribe from a realtime channel
 */
export const unsubscribeFromChannel = (channel: RealtimeChannel): void => {
  if (channel) {
    channel.unsubscribe();
  }
};
