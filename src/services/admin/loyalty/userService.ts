
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { UserRanking } from './types';
import { calculateMonthlyPoints, calculateLevelInfo } from '@/utils/pointsCalculations';

export const userService = {
  async getUserRanking(limit = 10): Promise<UserRanking[]> {
    try {
      console.log('📊 [userService] Fetching user ranking with monthly points calculation');

      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, saldo_pontos, created_at')
        .not('saldo_pontos', 'is', null)
        .order('saldo_pontos', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        console.warn('⚠️ [userService] No profiles found');
        return [];
      }

      console.log(`📊 [userService] Found ${profiles.length} profiles`);

      // Buscar todas as transações de pontos
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('user_id, pontos, tipo, data')
        .in('user_id', profiles.map(p => p.id));

      if (transactionsError) {
        console.error('⚠️ [userService] Error fetching transactions:', transactionsError);
      }

      // Agrupar transações por usuário
      const transactionsByUser = new Map<string, any[]>();
      const transactionCountMap = new Map<string, number>();
      
      allTransactions?.forEach(transaction => {
        const userId = transaction.user_id;
        
        // Agrupar transações por usuário
        if (!transactionsByUser.has(userId)) {
          transactionsByUser.set(userId, []);
        }
        transactionsByUser.get(userId)!.push({
          id: `${userId}-${transaction.data}`,
          tipo: transaction.tipo,
          pontos: transaction.pontos,
          data: transaction.data,
          descricao: transaction.tipo
        });
        
        // Contar total de transações
        const count = transactionCountMap.get(userId) || 0;
        transactionCountMap.set(userId, count + 1);
      });

      console.log(`📊 [userService] Grouped transactions for ${transactionsByUser.size} users`);

      // Processar cada usuário para calcular pontos mensais e nível correto
      const userRanking: UserRanking[] = profiles.map(profile => {
        const userTransactions = transactionsByUser.get(profile.id) || [];
        
        // Calcular pontos mensais usando a função do sistema
        const pontosMensais = calculateMonthlyPoints(userTransactions);
        
        // Calcular nível baseado nos pontos mensais
        const levelInfo = calculateLevelInfo(pontosMensais);
        
        console.log(`👤 [userService] User ${profile.nome}: Total=${profile.saldo_pontos}, Monthly=${pontosMensais}, Level=${levelInfo.levelName}`);
        
        return {
          id: profile.id,
          nome: profile.nome || 'Sem nome',
          email: profile.email || '',
          saldo_pontos: profile.saldo_pontos || 0,
          pontos_mensais: pontosMensais,
          nivel: levelInfo.levelName,
          total_transacoes: transactionCountMap.get(profile.id) || 0,
          ultima_atividade: profile.created_at || ''
        };
      });

      // Ordenar por pontos mensais (para ranking baseado no nível correto)
      const sortedRanking = userRanking
        .sort((a, b) => b.pontos_mensais - a.pontos_mensais)
        .slice(0, limit);

      console.log(`✅ [userService] Ranking created with ${sortedRanking.length} users based on monthly points`);
      
      return sortedRanking;

    } catch (error) {
      console.error('❌ [userService] Error fetching user ranking:', error);
      toast.error('Erro ao buscar ranking de usuários');
      return [];
    }
  }
};
