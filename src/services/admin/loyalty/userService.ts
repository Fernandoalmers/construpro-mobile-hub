
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRanking } from './types';

export const userService = {
  async getUserRanking(limit = 10): Promise<UserRanking[]> {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, saldo_pontos, created_at')
        .not('saldo_pontos', 'is', null)
        .order('saldo_pontos', { ascending: false })
        .limit(limit);

      if (profilesError) throw profilesError;

      // Buscar número de transações para cada usuário
      const userIds = profiles?.map(p => p.id) || [];
      const { data: transactionCounts } = await supabase
        .from('points_transactions')
        .select('user_id')
        .in('user_id', userIds);

      const transactionCountMap = new Map<string, number>();
      transactionCounts?.forEach(t => {
        const count = transactionCountMap.get(t.user_id) || 0;
        transactionCountMap.set(t.user_id, count + 1);
      });

      return profiles?.map(profile => {
        const pontos = profile.saldo_pontos || 0;
        let nivel = 'Bronze';
        if (pontos >= 5000) nivel = 'Ouro';
        else if (pontos >= 2000) nivel = 'Prata';

        return {
          id: profile.id,
          nome: profile.nome || 'Sem nome',
          email: profile.email || '',
          saldo_pontos: pontos,
          nivel,
          total_transacoes: transactionCountMap.get(profile.id) || 0,
          ultima_atividade: profile.created_at || ''
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      toast.error('Erro ao buscar ranking de usuários');
      return [];
    }
  }
};
