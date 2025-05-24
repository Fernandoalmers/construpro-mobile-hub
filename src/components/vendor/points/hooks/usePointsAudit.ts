
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AuditDetails {
  total_earned: number;
  total_redeemed: number;
  audit_timestamp: string;
}

interface PointsAuditResult {
  userId: string;
  profileBalance: number;
  transactionBalance: number;
  difference: number;
  duplicateTransactions: number;
  status: 'ok' | 'discrepancy' | 'error';
  details: AuditDetails;
}

interface TransactionSummary {
  totalEarned: number;
  totalRedeemed: number;
  netBalance: number;
}

interface AuditData {
  issue_type: string;
  current_balance: number;
  calculated_balance: number;
  difference: number;
  duplicate_count: number;
  corrected: boolean;
  details: AuditDetails | any; // Allow for Json type from Supabase
}

export const usePointsAudit = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<PointsAuditResult | null>(null);

  // Função para calcular o resumo das transações corretamente
  const calculateTransactionSummary = useCallback(async (userId: string): Promise<TransactionSummary> => {
    try {
      const { data: transactions, error } = await supabase
        .from('points_transactions')
        .select('pontos, tipo')
        .eq('user_id', userId);

      if (error) throw error;

      // Total ganho: apenas pontos positivos
      const totalEarned = transactions
        ?.filter(t => t.pontos > 0)
        .reduce((sum, t) => sum + t.pontos, 0) || 0;

      // Total resgatado: valor absoluto dos pontos negativos
      const totalRedeemed = Math.abs(transactions
        ?.filter(t => t.pontos < 0)
        .reduce((sum, t) => sum + t.pontos, 0) || 0);

      // Saldo líquido: soma de todas as transações
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

  // Helper function to safely extract audit details
  const extractAuditDetails = (details: any): AuditDetails => {
    // Handle if details is a string (JSON) or already an object
    let parsedDetails: any = details;
    
    if (typeof details === 'string') {
      try {
        parsedDetails = JSON.parse(details);
      } catch (e) {
        console.error('Error parsing audit details:', e);
        parsedDetails = {};
      }
    }

    return {
      total_earned: parsedDetails?.total_earned || 0,
      total_redeemed: parsedDetails?.total_redeemed || 0,
      audit_timestamp: parsedDetails?.audit_timestamp || new Date().toISOString()
    };
  };

  // Função principal de auditoria usando a nova função SQL
  const auditUserPoints = useCallback(async (userId: string): Promise<PointsAuditResult> => {
    setIsAuditing(true);
    
    try {
      // Usar a nova função de auditoria abrangente
      const { data: auditData, error: auditError } = await supabase.rpc('audit_user_points_comprehensive', {
        target_user_id: userId
      });

      if (auditError) throw auditError;

      let result: PointsAuditResult;

      if (auditData && auditData.length > 0) {
        const audit: AuditData = auditData[0];
        const auditDetails = extractAuditDetails(audit.details);
        
        result = {
          userId,
          profileBalance: audit.current_balance || 0,
          transactionBalance: audit.calculated_balance || 0,
          difference: audit.difference || 0,
          duplicateTransactions: audit.duplicate_count || 0,
          status: audit.issue_type === 'all_good' ? 'ok' : 'discrepancy',
          details: auditDetails
        };
      } else {
        // Fallback para auditoria manual se a função não retornar dados
        const transactionSummary = await calculateTransactionSummary(userId);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('saldo_pontos')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const profileBalance = profile?.saldo_pontos || 0;
        const difference = profileBalance - transactionSummary.netBalance;

        result = {
          userId,
          profileBalance,
          transactionBalance: transactionSummary.netBalance,
          difference,
          duplicateTransactions: 0,
          status: difference === 0 ? 'ok' : 'discrepancy',
          details: {
            total_earned: transactionSummary.totalEarned,
            total_redeemed: transactionSummary.totalRedeemed,
            audit_timestamp: new Date().toISOString()
          }
        };
      }

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
        status: 'error',
        details: {
          total_earned: 0,
          total_redeemed: 0,
          audit_timestamp: new Date().toISOString()
        }
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

      // 1. Primeiro, limpar duplicatas se existirem usando a nova função segura
      const { data: cleanResult, error: cleanError } = await supabase.rpc('clean_duplicate_transactions_safely');
      
      if (cleanError) {
        console.error('Erro ao limpar duplicatas:', cleanError);
      } else if (cleanResult && cleanResult.length > 0) {
        const deletedCount = cleanResult[0]?.deleted_count || 0;
        if (deletedCount > 0) {
          console.log(`Removidas ${deletedCount} transações duplicadas`);
        }
      }

      // 2. Reconciliar o saldo
      const { data: reconcileResult, error: reconcileError } = await supabase.rpc('reconcile_user_points', {
        target_user_id: userId
      });

      if (reconcileError) throw reconcileError;

      // 3. Fazer nova auditoria para verificar se foi corrigido
      const newAudit = await auditUserPoints(userId);

      const cleanedDuplicates = cleanResult?.[0]?.deleted_count || 0;
      const balanceAdjustment = reconcileResult?.[0]?.difference || 0;

      let successMessage = 'Correção concluída!';
      if (cleanedDuplicates > 0) {
        successMessage += ` Removidas ${cleanedDuplicates} transações duplicadas.`;
      }
      if (balanceAdjustment !== 0) {
        successMessage += ` Saldo ajustado em ${Math.abs(balanceAdjustment)} pontos.`;
      }
      if (cleanedDuplicates === 0 && balanceAdjustment === 0) {
        successMessage = 'Nenhuma correção necessária - dados já estão consistentes.';
      }

      toast.success(successMessage, { id: 'auto-fix', duration: 8000 });

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
