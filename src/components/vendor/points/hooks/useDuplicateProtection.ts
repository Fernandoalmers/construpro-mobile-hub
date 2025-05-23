
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Interface para grupos de transações duplicadas
 */
interface DuplicateGroup {
  group_id: number;
  transaction_count: number;
  user_id: string;
  tipo: string;
  pontos: number;
  descricao: string;
  transaction_ids: string[];
  data: string;
  time_frame: string;
}

/**
 * Hook para monitorar e lidar com possíveis transações duplicadas
 * Usa uma verificação periódica incorporada e limpeza sob demanda
 */
export const useDuplicateProtection = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const { isAdmin } = useIsAdmin();
  
  // Função para verificar duplicatas existentes usando a função SQL
  const checkForDuplicates = useCallback(async (silent = false) => {
    if (isChecking) return { duplicates: [], count: 0 };
    
    setIsChecking(true);
    try {
      // Chamar a função SQL get_duplicate_transactions diretamente
      const { data, error } = await supabase
        .from('get_duplicate_transactions')
        .select('*');
      
      if (error) {
        console.error('Erro ao verificar duplicatas:', error);
        if (!silent) {
          toast.error('Erro ao verificar transações duplicadas');
        }
        return { duplicates: [], count: 0 };
      }
      
      const duplicateGroups = data as DuplicateGroup[];
      const totalDuplicates = duplicateGroups.reduce((total, group) => 
        total + Math.max(0, group.transaction_count - 1), 0);
      
      setDuplicateGroups(duplicateGroups);
      setDuplicateCount(totalDuplicates);
      
      if (totalDuplicates > 0 && !silent) {
        toast.info(
          `Foram detectadas ${totalDuplicates} possíveis transações duplicadas.`, 
          {
            duration: 6000,
            action: isAdmin ? {
              label: "Limpar",
              onClick: () => cleanDuplicates()
            } : undefined
          }
        );
      }
      
      return { 
        duplicates: duplicateGroups, 
        count: totalDuplicates 
      };
    } catch (err) {
      console.error('Erro em checkForDuplicates:', err);
      return { duplicates: [], count: 0 };
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isAdmin]);
  
  // Função para limpar duplicatas
  const cleanDuplicates = useCallback(async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem limpar duplicações');
      return false;
    }
    
    setIsChecking(true);
    try {
      const toastId = 'clean-duplicates-toast';
      toast.loading('Limpando transações duplicadas...', { id: toastId });
      
      // Primeiro obter os grupos de duplicatas se ainda não tivermos
      let groups = duplicateGroups;
      if (groups.length === 0) {
        const result = await checkForDuplicates(true);
        groups = result.duplicates as DuplicateGroup[];
      }
      
      if (groups.length === 0) {
        toast.success('Não foram encontradas duplicações para remover', { id: toastId });
        return false;
      }
      
      // Para cada grupo, manter a primeira transação e excluir as demais
      let deletedCount = 0;
      
      for (const group of groups) {
        // Pular a primeira transação (índice 0) e excluir o resto
        const transactionsToDelete = group.transaction_ids.slice(1);
        
        if (transactionsToDelete.length > 0) {
          const { error } = await supabase
            .from('points_transactions')
            .delete()
            .in('id', transactionsToDelete);
          
          if (error) {
            console.error(`Erro ao excluir duplicatas do grupo ${group.group_id}:`, error);
            continue;
          }
          
          deletedCount += transactionsToDelete.length;
        }
      }
      
      // Após a limpeza, invocar a função de reconciliação para todos os usuários afetados
      const uniqueUserIds = [...new Set(groups.map(g => g.user_id))];
      let reconciliationCount = 0;
      
      for (const userId of uniqueUserIds) {
        const { data, error } = await supabase.rpc('reconcile_user_points', {
          target_user_id: userId
        });
        
        if (!error && data && data.length > 0 && data[0].difference !== 0) {
          reconciliationCount++;
        }
      }
      
      // Atualizar o estado
      setDuplicateCount(0);
      setDuplicateGroups([]);
      
      if (deletedCount > 0) {
        toast.success(`Removidas ${deletedCount} transações duplicadas`, { id: toastId });
        
        if (reconciliationCount > 0) {
          toast.success(`Reconciliados saldos de ${reconciliationCount} usuários`, {
            duration: 6000
          });
        }
        return true;
      } else {
        toast.success('Não foram encontradas duplicações para remover', { id: toastId });
        return false;
      }
    } catch (err) {
      console.error('Erro ao limpar duplicatas:', err);
      toast.error('Erro ao limpar duplicações');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isAdmin, duplicateGroups, checkForDuplicates]);
  
  // Verificar automaticamente duplicatas ao montar (silenciosamente)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForDuplicates(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [checkForDuplicates]);
  
  return {
    isChecking,
    duplicateCount,
    duplicateGroups,
    checkForDuplicates,
    cleanDuplicates
  };
};
