
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorOrders, VendorOrder } from '@/services/vendor/orders';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { runVendorDiagnostics, updateVendorStatus } from '@/services/vendor/orders/utils/diagnosticUtils';

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const [profileRoleFixed, setProfileRoleFixed] = useState<boolean | null>(null);
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isFixingVendorStatus, setIsFixingVendorStatus] = useState(false);
  
  // First check if the vendor profile exists
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
            usuario_id: profile.usuario_id,
            status: profile.status || 'unknown'
          });
          
          // Run diagnostics when profile is found
          console.log("🔍 [useVendorOrders] Running vendor diagnostics...");
          const diagnostics = await runVendorDiagnostics();
          setDiagnosticResults(diagnostics);
          console.log("📊 [useVendorOrders] Diagnostics completed:", diagnostics);
          
          // Check if vendor status is pending, which might be preventing orders from showing
          if (profile.status === 'pendente') {
            console.warn("⚠️ [useVendorOrders] Vendor status is 'pendente', which may be preventing orders from displaying");
            
            // Auto-fix vendor status after a short delay
            setTimeout(async () => {
              await fixVendorStatus(profile.id);
            }, 1500);
          }
        } else {
          setVendorProfileStatus('not_found');
          console.error("🚫 [useVendorOrders] No vendor profile found for current user");
          toast.error("Perfil de vendedor não encontrado", {
            description: "Configure seu perfil de vendedor para acessar esta funcionalidade"
          });
        }
      } catch (error) {
        console.error("🚫 [useVendorOrders] Error checking vendor profile:", error);
        setVendorProfileStatus('not_found');
      }
    };
    
    checkVendorProfile();
  }, []);
  
  // Function to fix vendor status if needed
  const fixVendorStatus = async (vendorId: string) => {
    try {
      setIsFixingVendorStatus(true);
      
      console.log("🔧 [useVendorOrders] Attempting to fix vendor status to 'ativo'");
      const result = await updateVendorStatus(vendorId, 'ativo');
      
      if (result.success) {
        toast.success("Status do vendedor atualizado", {
          description: "Status atualizado de 'pendente' para 'ativo'"
        });
        
        // Wait a moment before refreshing
        setTimeout(() => {
          console.log("🔄 [useVendorOrders] Refreshing orders after status update");
          queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
          refetch();
        }, 1000);
      } else {
        console.error("🚫 [useVendorOrders] Failed to update vendor status:", result.error);
      }
      
      setIsFixingVendorStatus(false);
    } catch (error) {
      console.error("🚫 [useVendorOrders] Error fixing vendor status:", error);
      setIsFixingVendorStatus(false);
    }
  };
  
  // Check and fix profile role if needed
  useEffect(() => {
    const fixProfileRole = async () => {
      try {
        if (vendorProfileStatus === 'found') {
          console.log("🔧 [useVendorOrders] Ensuring vendor profile role...");
          const updated = await ensureVendorProfileRole();
          setProfileRoleFixed(updated);
          
          if (updated) {
            console.log("✅ [useVendorOrders] Vendor profile role updated successfully");
            toast.success('Perfil de vendedor configurado com sucesso');
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
          } else {
            console.log("ℹ️ [useVendorOrders] Vendor profile role already correct, no update needed");
          }
        }
      } catch (error) {
        console.error("🚫 [useVendorOrders] Error fixing profile role:", error);
        toast.error("Erro ao configurar perfil de vendedor");
      }
    };
    
    fixProfileRole();
  }, [vendorProfileStatus, queryClient]);
  
  // Fetch orders with a shorter staleTime to ensure fresher data
  const { 
    data: orders = [], 
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: async () => {
      console.log("🔍 [useVendorOrders] Fetching vendor orders from service...");
      const results = await getVendorOrders();
      console.log(`📊 [useVendorOrders] Fetched ${results.length} vendor orders`);
      
      // Additional check for debugging if no orders were found
      if (results.length === 0) {
        console.log("⚠️ [useVendorOrders] No orders returned from getVendorOrders");
        
        const profile = await getVendorProfile();
        if (profile) {
          console.log("ℹ️ [useVendorOrders] Vendor profile re-checked:", {
            id: profile.id,
            nome_loja: profile.nome_loja,
            usuario_id: profile.usuario_id,
            status: profile.status || 'unknown'
          });
          
          // If status is pending, log a warning
          if (profile.status === 'pendente') {
            console.warn("⚠️ [useVendorOrders] Vendor has status 'pendente', which may be preventing orders from showing");
          }
        }
      } else {
        console.log("✅ [useVendorOrders] Orders found, sample first order:", {
          id: results[0]?.id,
          status: results[0]?.status,
          items_count: results[0]?.itens?.length || 0
        });
      }
      
      return results;
    },
    staleTime: 30 * 1000, // 30 seconds - reduced to get fresher data
    retry: 3, // Increase retries for more resilience
    enabled: vendorProfileStatus === 'found' && !isFixingVendorStatus,
  });

  // Force refresh whenever the component mounts or profile role is fixed
  useEffect(() => {
    if (vendorProfileStatus === 'found' && !isFixingVendorStatus) {
      console.log("🔄 [useVendorOrders] Automatically refreshing vendor orders");
      refetch();
    }
  }, [refetch, profileRoleFixed, vendorProfileStatus, isFixingVendorStatus]);
  
  const handleRefresh = () => {
    if (vendorProfileStatus === 'found') {
      toast.info('Atualizando lista de pedidos...');
      console.log("🔄 [useVendorOrders] Manually refreshing vendor orders");
      
      // Clear cache first to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      refetch();
    } else {
      toast.error('Configure seu perfil de vendedor primeiro');
    }
  };

  return {
    orders,
    isLoading,
    error,
    refetch,
    isRefetching,
    handleRefresh,
    profileRoleFixed,
    vendorProfileStatus,
    diagnosticResults,
    isFixingVendorStatus
  };
};
