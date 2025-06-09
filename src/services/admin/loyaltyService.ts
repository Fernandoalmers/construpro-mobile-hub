
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface LoyaltyStats {
  totalUsers: number;
  activeUsers: number;
  totalPointsInCirculation: number;
  averagePointsPerUser: number;
  topUserPoints: number;
  totalTransactions: number;
  totalAdjustments: number;
}

export interface UserRanking {
  id: string;
  nome: string;
  email: string;
  saldo_pontos: number;
  nivel: string;
  total_transacoes: number;
  ultima_atividade: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  pontos: number;
  tipo: string;
  descricao: string;
  data: string;
  reference_code?: string;
}

export interface VendorAdjustment {
  id: string;
  vendedor_id: string;
  vendedor_nome: string;
  usuario_id: string;
  usuario_nome: string;
  valor: number;
  tipo: string;
  motivo: string;
  created_at: string;
}

export interface VendorAdjustmentSummary {
  vendedor_id: string;
  vendedor_nome: string;
  total_ajustes: number;
  pontos_adicionados: number;
  pontos_removidos: number;
  ultimo_ajuste: string;
}

export const loyaltyService = {
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
  },

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
  },

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
  },

  async getVendorAdjustments(limit = 20): Promise<VendorAdjustment[]> {
    try {
      const { data: adjustments, error } = await supabase
        .from('pontos_ajustados')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Buscar nomes dos vendedores e usuários
      const vendorIds = [...new Set(adjustments?.map(a => a.vendedor_id) || [])];
      const userIds = [...new Set(adjustments?.map(a => a.usuario_id) || [])];

      const [vendorsData, usersData] = await Promise.all([
        supabase.from('vendedores').select('id, nome_loja').in('id', vendorIds),
        supabase.from('profiles').select('id, nome').in('id', userIds)
      ]);

      const vendorMap = new Map(vendorsData.data?.map(v => [v.id, v.nome_loja]) || []);
      const userMap = new Map(usersData.data?.map(u => [u.id, u.nome]) || []);

      return adjustments?.map(adjustment => ({
        ...adjustment,
        vendedor_nome: vendorMap.get(adjustment.vendedor_id) || 'Vendedor desconhecido',
        usuario_nome: userMap.get(adjustment.usuario_id) || 'Usuário desconhecido'
      })) || [];
    } catch (error) {
      console.error('Error fetching vendor adjustments:', error);
      toast.error('Erro ao buscar ajustes de vendedores');
      return [];
    }
  },

  async getVendorAdjustmentsSummary(): Promise<VendorAdjustmentSummary[]> {
    try {
      console.log('Fetching vendor adjustments summary with proper filtering...');

      // Use a single query with JOIN to get vendor adjustments with active vendor filtering
      const { data: adjustmentsWithVendors, error } = await supabase
        .from('pontos_ajustados')
        .select(`
          vendedor_id,
          tipo,
          valor,
          created_at,
          vendedores!inner(
            id,
            nome_loja,
            status
          )
        `)
        .eq('vendedores.status', 'ativo');

      if (error) {
        console.error('Error fetching vendor adjustments with vendors:', error);
        throw error;
      }

      console.log(`Found ${adjustmentsWithVendors?.length || 0} adjustments from active vendors`);

      if (!adjustmentsWithVendors || adjustmentsWithVendors.length === 0) {
        console.log('No adjustments found for active vendors');
        return [];
      }

      // Group and calculate statistics by vendor
      const vendorStatsMap = new Map<string, {
        vendedor_nome: string;
        total_ajustes: number;
        pontos_adicionados: number;
        pontos_removidos: number;
        ultimo_ajuste: string;
      }>();

      adjustmentsWithVendors.forEach(adjustment => {
        const vendorId = adjustment.vendedor_id;
        const vendorName = adjustment.vendedores?.nome_loja || 'Vendedor desconhecido';
        
        const current = vendorStatsMap.get(vendorId) || {
          vendedor_nome: vendorName,
          total_ajustes: 0,
          pontos_adicionados: 0,
          pontos_removidos: 0,
          ultimo_ajuste: adjustment.created_at
        };

        current.total_ajustes += 1;
        
        if (adjustment.tipo === 'adicao') {
          current.pontos_adicionados += adjustment.valor;
        } else {
          current.pontos_removidos += Math.abs(adjustment.valor);
        }

        // Update last adjustment date if this one is more recent
        if (new Date(adjustment.created_at) > new Date(current.ultimo_ajuste)) {
          current.ultimo_ajuste = adjustment.created_at;
        }

        vendorStatsMap.set(vendorId, current);
      });

      // Convert to array and sort by total adjustments
      const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
        vendedor_id: vendorId,
        vendedor_nome: stats.vendedor_nome,
        total_ajustes: stats.total_ajustes,
        pontos_adicionados: stats.pontos_adicionados,
        pontos_removidos: stats.pontos_removidos,
        ultimo_ajuste: stats.ultimo_ajuste
      })).sort((a, b) => b.total_ajustes - a.total_ajustes);

      console.log(`Returning summary for ${result.length} vendors:`, result.map(v => v.vendedor_nome));
      return result;

    } catch (error) {
      console.error('Error fetching vendor adjustments summary:', error);
      toast.error('Erro ao buscar resumo de ajustes por vendedor');
      return [];
    }
  },

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
