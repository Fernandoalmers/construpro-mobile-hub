
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorOrders, VendorOrder } from '@/services/vendor/orders';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const [profileRoleFixed, setProfileRoleFixed] = useState<boolean | null>(null);
  
  // Check and fix profile role if needed
  useEffect(() => {
    const fixProfileRole = async () => {
      const updated = await ensureVendorProfileRole();
      setProfileRoleFixed(updated);
      if (updated) {
        toast.success('Perfil de vendedor configurado com sucesso');
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      }
    };
    
    fixProfileRole();
  }, [queryClient]);
  
  // Fetch orders with a shorter staleTime to ensure fresher data
  const { 
    data: orders = [], 
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: getVendorOrders,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2
  });

  // Force refresh whenever the component mounts or profile role is fixed
  useEffect(() => {
    refetch();
  }, [refetch, profileRoleFixed]);
  
  const handleRefresh = () => {
    toast.info('Atualizando lista de pedidos...');
    refetch();
  };

  return {
    orders,
    isLoading,
    error,
    refetch,
    isRefetching,
    handleRefresh,
    profileRoleFixed
  };
};
