
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface PointsAuditResult {
  userId: string;
  profileBalance: number;
  transactionBalance: number;
  difference: number;
  duplicateTransactions: number;
  status: 'ok' | 'discrepancy' | 'error';
}

interface TransactionSummary {
  totalEarned: number;
  totalRedeemed: number;
  netBalance: number;
}

export const usePointsAudit = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<PointsAuditResult | null>(null);

  // Função para calcular o resumo das transações
  const calculateTransactionSummary = useCallback(async (userId: string): Promise<TransactionSummary> => {
    try {
      const { data: transactions, error } = await supabase
        .from('points_transactions')
        .select('pontos, tipo')
        .eq('user_id', userId);

      if (error) throw error;

      const totalEarned = transactions
        ?.filter(t => t.pontos > 0)
        .reduce((sum, t) => sum + t.pontos, 0) || 0;

      const totalRedeemed = Math.abs(transactions
        ?.filter(t => t.pontos < 0)
        .reduce((sum, t) => sum + t.pontos, 0) || 0);

      const netBalance = transactions
        ?.reduce((sum, t) => sum + t.pontos, 0) || 0;

      return {
        totalEarned,
        totalRedeemed,
        netBalance
      };
    } catch (error) {
      console.error('Erro ao calcular resumo das transações:', error);
      return { totalEarned: 0, totalRedeemed: 0, netBalance: 0 };
    }
  }, []);

  // Função principal de auditoria
  const auditUserPoints = useCallback(async (userId: string): Promise<PointsAuditResult> => {
    setIsAuditing(true);
    
    try {
      // Buscar saldo do perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('saldo_pontos')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Calcular saldo das transações
      const transactionSummary = await calculateTransactionSummary(userId);

      // Verificar duplicatas
      const { data: duplicates, error: duplicatesError } = await supabase.rpc('get_duplicate_transactions');
      
      const userDuplicates = duplicatesError ? 0 : 
        (duplicates as any[])?.filter((group: any) => group.user_id === userId)
        .reduce((total: number, group: any) => total + Math.max(0, group.transaction_count - 1), 0) || 0;

      const profileBalance = profile?.saldo_pontos || 0;
      const transactionBalance = transactionSummary.netBalance;
      const difference = profileBalance - transactionBalance;

      const result: PointsAuditResult = {
        userId,
        profileBalance,
        transactionBalance,
        difference,
        duplicateTransactions: userDuplicates,
        status: difference === 0 && userDuplicates === 0 ? 'ok' : 'discrepancy'
      };

      setAuditResults(result);
      return result;

    } catch (error) {
      console.error('Erro na auditoria de pontos:', error);
      const errorResult: PointsAuditResult = {
        userId,
        profileBalance: 0,
        transactionBalance: 0,
        difference: 0,
        duplicateTransactions: 0,
        status: 'error'
      };
      setAuditResults(errorResult);
      return errorResult;
    } finally {
      setIsAuditing(false);
    }
  }, [calculateTransactionSummary]);

  // Função para corrigir discrepâncias automaticamente
  const autoFixDiscrepancies = useCallback(async (userId: string) => {
    setIsAuditing(true);
    
    try {
      toast.loading('Corrigindo discrepâncias...', { id: 'auto-fix' });

      // 1. Primeiro, limpar duplicatas se existirem
      const { data: duplicates } = await supabase.rpc('get_duplicate_transactions');
      const userDuplicates = (duplicates as any[])?.filter((group: any) => group.user_id === userId) || [];
      
      if (userDuplicates.length > 0) {
        // Remover duplicatas para este usuário
        for (const group of userDuplicates) {
          const transactionsToDelete = group.transaction_ids.slice(1);
          if (transactionsToDelete.length > 0) {
            await supabase
              .from('points_transactions')
              .delete()
              .in('id', transactionsToDelete);
          }
        }
      }

      // 2. Reconciliar o saldo
      const { data: reconcileResult, error: reconcileError } = await supabase.rpc('reconcile_user_points', {
        target_user_id: userId
      });

      if (reconcileError) throw reconcileError;

      // 3. Fazer nova auditoria para verificar se foi corrigido
      const newAudit = await auditUserPoints(userId);

      toast.success(
        `Correção concluída! ${userDuplicates.length > 0 ? `Removidas ${userDuplicates.reduce((sum: number, g: any) => sum + Math.max(0, g.transaction_count - 1), 0)} duplicatas. ` : ''}${reconcileResult?.[0]?.difference !== 0 ? `Saldo ajustado em ${reconcileResult[0].difference} pontos.` : 'Saldo já estava correto.'}`,
        { id: 'auto-fix', duration: 8000 }
      );

      return newAudit;

    } catch (error) {
      console.error('Erro ao corrigir discrepâncias:', error);
      toast.error('Erro ao corrigir discrepâncias automaticamente', { id: 'auto-fix' });
      throw error;
    } finally {
      setIsAuditing(false);
    }
  }, [auditUserPoints]);

  return {
    isAuditing,
    auditResults,
    auditUserPoints,
    autoFixDiscrepancies,
    calculateTransactionSummary
  };
};
