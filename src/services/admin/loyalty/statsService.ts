
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { LoyaltyStats } from './types';

export const statsService = {
  async getLoyaltyStats(): Promise<LoyaltyStats> {
    try {
      // Buscar estatísticas básicas
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('saldo_pontos')
        .not('saldo_pontos', 'is', null);

      if (profilesError) throw profilesError;

      const { data: transactions, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('id');

      if (transactionsError) throw transactionsError;

      const { data: adjustments, error: adjustmentsError } = await supabase
        .from('pontos_ajustados')
        .select('id');

      if (adjustmentsError) throw adjustmentsError;

      const totalUsers = profiles?.length || 0;
      const activeUsers = profiles?.filter(p => (p.saldo_pontos || 0) > 0).length || 0;
      const totalPointsInCirculation = profiles?.reduce((sum, p) => sum + (p.saldo_pontos || 0), 0) || 0;
      const averagePointsPerUser = totalUsers > 0 ? Math.round(totalPointsInCirculation / totalUsers) : 0;
      const topUserPoints = Math.max(...(profiles?.map(p => p.saldo_pontos || 0) || [0]));

      return {
        totalUsers,
        activeUsers,
        totalPointsInCirculation,
        averagePointsPerUser,
        topUserPoints,
        totalTransactions: transactions?.length || 0,
        totalAdjustments: adjustments?.length || 0
      };
    } catch (error) {
      console.error('Error fetching loyalty stats:', error);
      toast.error('Erro ao buscar estatísticas do clube de fidelidade');
      throw error;
    }
  }
};
