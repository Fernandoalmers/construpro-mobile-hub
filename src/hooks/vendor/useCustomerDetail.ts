
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVendorCustomer, getCustomerPoints } from '@/services/vendorCustomersService';
import { getPointAdjustments } from '@/services/vendorPointsService';
import { toast } from '@/components/ui/sonner';

export const useCustomerDetail = (customerId: string) => {
  const [isAddingPoints, setIsAddingPoints] = useState(false);

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

  // Fetch customer points
  const {
    data: customerPoints = 0,
    isLoading: isLoadingPoints,
    refetch: refetchPoints
  } = useQuery({
    queryKey: ['customerPoints', customerId],
    queryFn: () => getCustomerPoints(customerId),
    enabled: !!customerId,
  });

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
    toast.loading('Atualizando dados do cliente...');
    await Promise.all([
      refetchCustomer(),
      refetchPoints(),
      refetchAdjustments()
    ]);
    toast.success('Dados atualizados com sucesso');
  };

  return {
    customer,
    customerPoints,
    pointAdjustments,
    isLoading,
    error: customerError,
    isAddingPoints,
    setIsAddingPoints,
    refreshCustomerData
  };
};
