
import { supabase } from '@/integrations/supabase/client';

// Type definition for realtime event handlers
type StoreRealtimeEventHandler = (payload: any, eventType: string) => void;

/**
 * Subscribe to real-time updates for admin stores
 * @param callback Function to call when store data changes
 * @returns Object with unsubscribe method
 */
export const subscribeToAdminStoreUpdates = (
  callback: StoreRealtimeEventHandler
) => {
  console.log('[StoreRealtime] Setting up store update subscription');
  
  const channel = supabase
    .channel('admin-stores-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vendedores' },
      (payload) => {
        console.log('[StoreRealtime] Store update received:', payload);
        // Pass the payload and event type to the callback
        callback(payload.new || payload.old, payload.eventType);
      }
    )
    .subscribe((status) => {
      console.log('[StoreRealtime] Subscription status:', status);
    });

  // Return unsubscribe method
  return {
    unsubscribe: () => {
      console.log('[StoreRealtime] Unsubscribing from store updates');
      supabase.removeChannel(channel);
    }
  };
};
