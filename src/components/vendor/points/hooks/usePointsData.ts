
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useCallback, useEffect } from 'react';
import { getCustomerPoints } from '@/services/vendor/customers';
import { getPointAdjustments } from '@/services/vendor/points/adjustmentsFetcher';
import { toast } from '@/components/ui/sonner';
import { useDuplicateProtection } from './useDuplicateProtection';
import { usePointsAudit } from './usePointsAudit';

export const usePointsData = (selectedCustomerId: string | null) => {
  const [activeTab, setActiveTab] = useState('form');
  const queryClient = useQueryClient();
  const { checkForDuplicates } = useDuplicateProtection();
  const { auditUserPoints, autoFixDiscrepancies, auditResults } = usePointsAudit();
  
  // Ref to track if a refresh is already in progress
  const isRefreshing = useRef(false);

  // Get customer's points with shorter staleTime and more retries
  const { 
    data: customerPoints = 0, 
    isLoading: isLoadingPoints, 
    refetch: refetchPoints,
    isError: isPointsError,
    error: pointsError
  } = useQuery({
    queryKey: ['customerPoints', selectedCustomerId],
    queryFn: async () => {
      console.log('Fetching points for customer ID:', selectedCustomerId);
      if (!selectedCustomerId) return 0;
      try {
        return await getCustomerPoints(selectedCustomerId);
      } catch (error) {
        console.error('Error fetching customer points:', error);
        toast.error('Erro ao buscar pontos do cliente');
        return 0;
      }
    },
    enabled: !!selectedCustomerId,
    staleTime: 500, // 500ms (reduced from 1 second)
    retry: 3,
    refetchOnWindowFocus: true
  });

  // Get point adjustments history for the selected customer
  const { 
    data: adjustments = [], 
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments,
    isError: isAdjustmentsError,
    error: adjustmentsError
  } = useQuery({
    queryKey: ['pointAdjustments', selectedCustomerId],
    queryFn: async () => {
      console.log('Fetching adjustments for customer ID:', selectedCustomerId);
      if (!selectedCustomerId) return [];
      try {
        const result = await getPointAdjustments(selectedCustomerId);
        console.log(`Found ${result.length} adjustments for customer:`, selectedCustomerId);
        return result;
      } catch (error) {
        console.error('Error fetching point adjustments:', error);
        toast.error('Erro ao buscar histórico de ajustes');
        return [];
      }
    },
    enabled: !!selectedCustomerId,
    staleTime: 10000, // 10 seconds
    retry: 2
  });

  // Fazer auditoria automática quando o cliente é selecionado
  useEffect(() => {
    if (selectedCustomerId) {
      auditUserPoints(selectedCustomerId);
    }
  }, [selectedCustomerId, auditUserPoints]);

  // Auto-fix discrepancies when detected
  useEffect(() => {
    if (auditResults && selectedCustomerId) {
      const hasDiscrepancies = auditResults.difference !== 0 || 
                             auditResults.duplicateTransactions > 0 ||
                             auditResults.status === 'discrepancy';
      
      if (hasDiscrepancies) {
        console.log('Discrepancies detected, auto-fixing...', auditResults);
        // Auto-fix silently in the background
        autoFixDiscrepancies(selectedCustomerId).then(() => {
          // Refresh data after auto-fix
          setTimeout(() => {
            refetchPoints();
            refetchAdjustments();
          }, 1000);
        }).catch(error => {
          console.error('Auto-fix failed:', error);
        });
      }
    }
  }, [auditResults, selectedCustomerId, autoFixDiscrepancies, refetchPoints, refetchAdjustments]);

  // Handle manual refresh of data with audit
  const handleRefreshData = useCallback(() => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing.current || !selectedCustomerId) return;
    
    isRefreshing.current = true;
    console.log('Manually refreshing data for customer:', selectedCustomerId);
    toast.loading('Atualizando dados...');
    
    // Force invalidate the queries first
    queryClient.invalidateQueries({
      queryKey: ['customerPoints', selectedCustomerId]
    });
    
    queryClient.invalidateQueries({
      queryKey: ['pointAdjustments', selectedCustomerId]
    });
    
    // Also invalidate points history across the app
    queryClient.invalidateQueries({
      queryKey: ['pointsHistory']
    });
    
    // Check for duplicates and do audit
    checkForDuplicates(true);
    
    // Then refetch with a small delay
    setTimeout(() => {
      Promise.all([
        refetchPoints(), 
        refetchAdjustments(),
        auditUserPoints(selectedCustomerId)
      ])
        .then(() => {
          toast.success('Dados atualizados com sucesso');
          console.log('Data refreshed successfully');
        })
        .catch((error) => {
          console.error('Error refreshing data:', error);
          toast.error('Erro ao atualizar dados');
        })
        .finally(() => {
          // Reset the refresh flag
          isRefreshing.current = false;
        });
    }, 300);
  }, [selectedCustomerId, refetchPoints, refetchAdjustments, queryClient, checkForDuplicates, auditUserPoints]);

  const handleAdjustmentSuccess = useCallback(() => {
    // Immediately invalidate the queries
    if (selectedCustomerId) {
      // First invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ['customerPoints']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['pointAdjustments']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['pointsHistory']
      });
      
      // Check for duplicates after adjustment (silently)
      setTimeout(() => {
        checkForDuplicates(true);
      }, 1500);
      
      // Then force a hard refresh with audit
      setTimeout(() => {
        refetchPoints();
        refetchAdjustments();
        auditUserPoints(selectedCustomerId);
        setActiveTab('history');
        toast.success('Ajuste de pontos registrado com sucesso');
      }, 1000); // Give time for database to process
    }
  }, [selectedCustomerId, refetchPoints, refetchAdjustments, queryClient, checkForDuplicates, auditUserPoints]);

  // Função para corrigir discrepâncias automaticamente
  const handleAutoFixDiscrepancies = useCallback(async () => {
    if (!selectedCustomerId) return;
    
    try {
      await autoFixDiscrepancies(selectedCustomerId);
      // Refresh data after auto-fix
      setTimeout(() => {
        handleRefreshData();
      }, 1000);
    } catch (error) {
      console.error('Error in auto-fix:', error);
    }
  }, [selectedCustomerId, autoFixDiscrepancies, handleRefreshData]);

  return {
    customerPoints,
    isLoadingPoints,
    adjustments,
    isLoadingAdjustments,
    activeTab,
    setActiveTab,
    handleRefreshData,
    handleAdjustmentSuccess,
    isPointsError,
    pointsError,
    isAdjustmentsError,
    adjustmentsError,
    // Audit-related functionality
    auditResults,
    handleAutoFixDiscrepancies
  };
};
