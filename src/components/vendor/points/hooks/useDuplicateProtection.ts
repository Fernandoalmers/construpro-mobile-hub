
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';

/**
 * Hook to monitor and handle potential duplicate transactions
 * Uses a built-in periodic check and on-demand cleanup
 */
export const useDuplicateProtection = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const { isAdmin } = useIsAdmin();
  
  // Function to check for existing duplicates
  const checkForDuplicates = useCallback(async (silent = false) => {
    if (isChecking) return { duplicates: [], count: 0 };
    
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('clean-duplicate-transactions', {
        method: 'POST',
        body: { 
          dryRun: true 
        }
      });
      
      if (error) {
        console.error('Error checking for duplicates:', error);
        if (!silent) {
          toast.error('Erro ao verificar transações duplicadas');
        }
        return { duplicates: [], count: 0 };
      }
      
      const count = data?.duplicates?.length || 0;
      setDuplicateCount(count);
      
      if (count > 0 && !silent) {
        toast.info(
          `Foram detectadas ${count} possíveis transações duplicadas.`, 
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
        duplicates: data?.duplicates || [], 
        count 
      };
    } catch (err) {
      console.error('Error in checkForDuplicates:', err);
      return { duplicates: [], count: 0 };
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isAdmin]);
  
  // Function to clean duplicates
  const cleanDuplicates = useCallback(async () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem limpar duplicações');
      return false;
    }
    
    setIsChecking(true);
    try {
      const toastId = 'clean-duplicates-toast';
      toast.loading('Limpando transações duplicadas...', { id: toastId });
      
      const { data, error } = await supabase.functions.invoke('clean-duplicate-transactions', {
        method: 'POST',
        body: { 
          dryRun: false,
          forceCleanup: true
        }
      });
      
      if (error) {
        toast.error('Erro ao limpar duplicações: ' + error.message, { id: toastId });
        return false;
      }
      
      const removedCount = data?.deletedCount || 0;
      const triggersRemoved = data?.triggersRemoved || 0;
      
      if (removedCount > 0) {
        toast.success(`Removidas ${removedCount} transações duplicadas`, { id: toastId });
        setDuplicateCount(0);
        return true;
      } else {
        toast.success('Não foram encontradas duplicações para remover', { id: toastId });
        return false;
      }
    } catch (err) {
      console.error('Error cleaning duplicates:', err);
      toast.error('Erro ao limpar duplicações');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isAdmin]);
  
  // Automatically check for duplicates on mount (silently)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForDuplicates(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [checkForDuplicates]);
  
  return {
    isChecking,
    duplicateCount,
    checkForDuplicates,
    cleanDuplicates
  };
};
