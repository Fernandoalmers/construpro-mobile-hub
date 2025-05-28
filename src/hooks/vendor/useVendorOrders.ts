
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorOrders, VendorOrder } from '@/services/vendorOrdersService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { supabase } from '@/integrations/supabase/client';

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  
  // Check if the vendor profile exists
  useEffect(() => {
    const checkVendorProfile = async () => {
      try {
        console.log("🔍 [useVendorOrders] Checking vendor profile...");
        
        // First ensure user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("🚫 [useVendorOrders] User not authenticated:", userError);
          setVendorProfileStatus('not_found');
          return;
        }
        
        console.log("👤 [useVendorOrders] User authenticated:", user.id);
        
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
  
  // Fetch orders with improved error handling and authentication checks
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
        // Verify authentication before proceeding
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("🚫 [useVendorOrders] Authentication failed:", authError);
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        
        console.log("👤 [useVendorOrders] User verified:", user.id);
        
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
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('autenticado')) {
          toast.error('Sessão expirada. Faça login novamente.');
        }
        
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error instanceof Error && error.message.includes('autenticado')) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: vendorProfileStatus === 'found',
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Auto refresh every 30 seconds
  });
  
  const handleRefresh = useCallback(async () => {
    if (vendorProfileStatus === 'found') {
      // Check authentication before refresh
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
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
