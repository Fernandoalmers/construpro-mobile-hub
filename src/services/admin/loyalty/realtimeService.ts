
import { supabase } from '@/integrations/supabase/client';

export const realtimeService = {
  // Real-time subscription setup
  subscribeToLoyaltyUpdates(
    onStatsUpdate: () => void,
    onTransactionsUpdate: () => void,
    onAdjustmentsUpdate: () => void
  ) {
    console.log('Setting up real-time subscriptions for loyalty dashboard...');

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('Profile updated, refreshing stats');
          onStatsUpdate();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'points_transactions'
        },
        () => {
          console.log('Transaction updated, refreshing data');
          onStatsUpdate();
          onTransactionsUpdate();
        }
      )
      .subscribe();

    const adjustmentsChannel = supabase
      .channel('adjustments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pontos_ajustados'
        },
        () => {
          console.log('Adjustment updated, refreshing data and clearing cache');
          onStatsUpdate();
          onAdjustmentsUpdate();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(adjustmentsChannel);
    };
  }
};
