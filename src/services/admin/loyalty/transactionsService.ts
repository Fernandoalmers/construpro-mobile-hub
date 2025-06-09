
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { PointsTransaction } from './types';

export const transactionsService = {
  async getRecentTransactions(limit = 20): Promise<PointsTransaction[]> {
    try {
      const { data: transactions, error } = await supabase
        .from('points_transactions')
        .select(`
          id,
          user_id,
          pontos,
          tipo,
          descricao,
          data,
          reference_code
        `)
        .order('data', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Buscar nomes dos usuários
      const userIds = [...new Set(transactions?.map(t => t.user_id) || [])];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return transactions?.map(transaction => {
        const user = userMap.get(transaction.user_id);
        return {
          ...transaction,
          user_name: user?.nome || 'Usuário desconhecido',
          user_email: user?.email || ''
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      toast.error('Erro ao buscar transações recentes');
      return [];
    }
  }
};
