
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to updates in the vendedores table for real-time admin updates
 */
export const subscribeToAdminStoreUpdates = (
  callback: (store: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  console.log('Setting up realtime subscription for vendedores table');
  
  const channel = supabase
    .channel('admin-store-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendedores',
      },
      (payload) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const storeData = payload.new || payload.old;
        callback(storeData, eventType);
      }
    )
    .subscribe();

  return {
    channel,
    unsubscribe: () => {
      channel.unsubscribe();
    }
  };
};
