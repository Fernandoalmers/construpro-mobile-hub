
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import { getCustomerPoints } from '@/services/vendor/customers';
import { getPointAdjustments } from '@/services/vendor/points/adjustmentsFetcher';
import { toast } from '@/components/ui/sonner';

export const usePointsData = (selectedCustomerId: string | null) => {
  const [activeTab, setActiveTab] = useState('form');
  const queryClient = useQueryClient();
  
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

  // Handle manual refresh of data with debouncing
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
    
    // Then refetch with a small delay
    setTimeout(() => {
      Promise.all([refetchPoints(), refetchAdjustments()])
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
  }, [selectedCustomerId, refetchPoints, refetchAdjustments, queryClient]);

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
      
      // Then force a hard refresh with a slight delay
      setTimeout(() => {
        refetchPoints();
        refetchAdjustments();
        setActiveTab('history');
        toast.success('Ajuste de pontos registrado com sucesso');
      }, 1000); // Give time for database to process
    }
  }, [selectedCustomerId, refetchPoints, refetchAdjustments, queryClient]);

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
    adjustmentsError
  };
};
