
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVendorCustomer, getCustomerPoints } from '@/services/vendorCustomersService';
import { getPointAdjustments } from '@/services/vendorPointsService';
import { toast } from '@/components/ui/sonner';

export const useCustomerDetail = (customerId: string) => {
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  
  // For debugging the customer ID
  useEffect(() => {
    if (customerId) {
      console.log('Using customer detail for ID:', customerId);
    }
  }, [customerId]);

  // Fetch customer details
  const { 
    data: customer, 
    isLoading: isLoadingCustomer,
    error: customerError,
    refetch: refetchCustomer
  } = useQuery({
    queryKey: ['vendorCustomer', customerId],
    queryFn: () => getVendorCustomer(customerId),
    enabled: !!customerId,
  });

  // Fetch customer points - Improved with better error handling
  const {
    data: customerPoints = 0,
    isLoading: isLoadingPoints,
    refetch: refetchPoints,
    error: pointsError
  } = useQuery({
    queryKey: ['customerPoints', customerId],
    queryFn: async () => {
      console.log('Fetching points for customer ID:', customerId);
      try {
        const points = await getCustomerPoints(customerId);
        console.log('Points retrieved:', points);
        return points || 0;
      } catch (error) {
        console.error('Error fetching points:', error);
        throw error;
      }
    },
    enabled: !!customerId,
    staleTime: 30000, // 30 seconds cache
    retry: 2
  });

  // Log points error if there is one
  useEffect(() => {
    if (pointsError) {
      console.error('Points fetch error:', pointsError);
    }
  }, [pointsError]);

  // Fetch point adjustments history
  const {
    data: pointAdjustments = [],
    isLoading: isLoadingAdjustments,
    refetch: refetchAdjustments
  } = useQuery({
    queryKey: ['pointAdjustments', customerId],
    queryFn: () => getPointAdjustments(customerId),
    enabled: !!customerId,
  });

  const isLoading = isLoadingCustomer || isLoadingPoints || isLoadingAdjustments;

  // Refresh all customer data
  const refreshCustomerData = async () => {
    if (!customerId) return;
    
    toast.loading('Atualizando dados do cliente...');
    console.log('Refreshing customer data for ID:', customerId);
    
    try {
      await Promise.all([
        refetchCustomer(),
        refetchPoints(),
        refetchAdjustments()
      ]);
      toast.success('Dados atualizados com sucesso');
      console.log('Customer data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing customer data:', error);
      toast.error('Erro ao atualizar dados do cliente');
    }
  };

  return {
    customer,
    customerPoints: customerPoints ?? 0, // Ensure we always return at least 0
    pointAdjustments,
    isLoading,
    error: customerError,
    isAddingPoints,
    setIsAddingPoints,
    refreshCustomerData
  };
};
