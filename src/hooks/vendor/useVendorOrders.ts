
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorOrders, VendorOrder } from '@/services/vendorOrdersService';
import { getVendorProfile } from '@/services/vendorProfileService';

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  
  // Check if the vendor profile exists
  useEffect(() => {
    const checkVendorProfile = async () => {
      try {
        console.log("🔍 [useVendorOrders] Checking vendor profile...");
        const profile = await getVendorProfile();
        
        if (profile) {
          setVendorProfileStatus('found');
          console.log("✅ [useVendorOrders] Vendor profile found:", {
            id: profile.id,
            nome_loja: profile.nome_loja,
            status: profile.status || 'unknown'
          });
        } else {
          setVendorProfileStatus('not_found');
          console.error("🚫 [useVendorOrders] No vendor profile found for current user");
        }
      } catch (error) {
        console.error("🚫 [useVendorOrders] Error checking vendor profile:", error);
        setVendorProfileStatus('not_found');
      }
    };
    
    checkVendorProfile();
  }, []);
  
  // Fetch orders with simplified logic
  const { 
    data: orders = [], 
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: async () => {
      console.log("🔍 [useVendorOrders] Fetching vendor orders...");
      
      try {
        const results = await getVendorOrders();
        console.log(`📊 [useVendorOrders] Fetched ${results.length} vendor orders`);
        
        if (results.length > 0) {
          console.log("✅ [useVendorOrders] Sample first order:", {
            id: results[0]?.id,
            status: results[0]?.status,
            items_count: results[0]?.itens?.length || 0,
            customer: results[0]?.cliente?.nome,
            total: results[0]?.valor_total
          });
        } else {
          console.log("⚠️ [useVendorOrders] No orders found");
        }
        
        return results;
      } catch (error) {
        console.error("🚫 [useVendorOrders] Error fetching orders:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: vendorProfileStatus === 'found',
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Auto refresh every 30 seconds
  });
  
  const handleRefresh = useCallback(() => {
    if (vendorProfileStatus === 'found') {
      toast.info('Atualizando lista de pedidos...');
      console.log("🔄 [useVendorOrders] Manually refreshing vendor orders");
      
      // Clear cache and refetch
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      refetch();
    } else {
      toast.error('Configure seu perfil de vendedor primeiro');
    }
  }, [vendorProfileStatus, queryClient, refetch]);

  return {
    orders,
    isLoading,
    error,
    refetch,
    isRefetching,
    handleRefresh,
    vendorProfileStatus,
    diagnosticResults: null, // Simplified - removed complex diagnostics
    isFixingVendorStatus: false, // Simplified
    debugMode: false, // Simplified
    debugData: null, // Simplified
    toggleDebugMode: () => {}, // Simplified
    forceRefresh: handleRefresh // Use same as handleRefresh
  };
};
