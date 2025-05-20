
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorOrders, VendorOrder, fetchDirectVendorOrdersWithDebug } from '@/services/vendorOrdersService';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { runVendorDiagnostics, updateVendorStatus } from '@/services/vendor/orders/utils/diagnosticUtils';

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const [profileRoleFixed, setProfileRoleFixed] = useState<boolean | null>(null);
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isFixingVendorStatus, setIsFixingVendorStatus] = useState(false);
  // Debug mode is ALWAYS activated by default for easier diagnosis
  const [debugMode, setDebugMode] = useState(true);
  const [debugData, setDebugData] = useState<any>(null);
  
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
          
          // Immediate fetch of debug information when profile is found
          fetchDebugOrdersImmediate(profile.id);
          
          // Check if vendor status is pending, which might be preventing orders from showing
          if (profile.status === 'pendente') {
            console.warn("⚠️ [useVendorOrders] Vendor status is 'pendente', which may be preventing orders from displaying");
            toast.warning("Status do vendedor é 'pendente'", {
              description: "Isso pode estar impedindo a visualização dos pedidos. Considere atualizar o status."
            });
            
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
  
  // Immediate fetch of debug orders without waiting for useEffect
  const fetchDebugOrdersImmediate = async (vendorId: string) => {
    try {
      console.log("🔍 [useVendorOrders] Immediately fetching debug orders data for vendor:", vendorId);
      const result = await fetchDirectVendorOrdersWithDebug(vendorId, undefined, true);
      console.log("📊 [useVendorOrders] Immediate debug data:", result);
      setDebugData(result);
      return result;
    } catch (error) {
      console.error("🚫 [useVendorOrders] Error in immediate debug fetch:", error);
      return null;
    }
  };
  
  // Regular fetch debug orders function for callbacks
  const fetchDebugOrders = useCallback(async () => {
    if (!debugMode) return null;
    
    try {
      const profile = await getVendorProfile();
      if (!profile) return null;
      
      console.log("🔍 [useVendorOrders] Fetching orders with debug info...");
      const result = await fetchDirectVendorOrdersWithDebug(profile.id, undefined, true);
      console.log("📊 [useVendorOrders] Debug data:", result.debug);
      setDebugData(result);
      return result;
    } catch (error) {
      console.error("🚫 [useVendorOrders] Error fetching debug orders:", error);
      return null;
    }
  }, [debugMode]);
  
  // Run debug fetch when debug mode changes
  useEffect(() => {
    if (debugMode && vendorProfileStatus === 'found') {
      fetchDebugOrders();
    }
  }, [debugMode, vendorProfileStatus, fetchDebugOrders]);
  
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
      
      try {
        // First try to get orders from debug function for more info
        const profile = await getVendorProfile();
        if (profile) {
          const debugResult = await fetchDirectVendorOrdersWithDebug(profile.id, undefined, true);
          if (debugResult && debugResult.orders && debugResult.orders.length > 0) {
            console.log(`✅ [useVendorOrders] Found ${debugResult.orders.length} orders directly`);
            setDebugData(debugResult);
            return debugResult.orders;
          } else {
            console.log("⚠️ [useVendorOrders] No orders from direct debug fetch, trying standard method");
          }
        }
        
        // Fall back to standard method
        const results = await getVendorOrders();
        console.log(`📊 [useVendorOrders] Fetched ${results.length} vendor orders via standard method`);
        
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
      } catch (error) {
        console.error("🚫 [useVendorOrders] Error fetching orders:", error);
        throw error;
      }
    },
    staleTime: 5 * 1000, // 5 seconds - Reduced even more for fresher data
    retry: 3, // Increase retries for more resilience
    enabled: vendorProfileStatus === 'found' && !isFixingVendorStatus,
    refetchInterval: 15000, // Auto refresh every 15 seconds
    refetchOnWindowFocus: true
  });

  // Force refresh whenever the component mounts or profile role is fixed
  useEffect(() => {
    if (vendorProfileStatus === 'found' && !isFixingVendorStatus) {
      console.log("🔄 [useVendorOrders] Automatically refreshing vendor orders");
      refetch();
    }
  }, [refetch, profileRoleFixed, vendorProfileStatus, isFixingVendorStatus]);
  
  const handleRefresh = useCallback(() => {
    if (vendorProfileStatus === 'found') {
      toast.info('Atualizando lista de pedidos...');
      console.log("🔄 [useVendorOrders] Manually refreshing vendor orders");
      
      // Clear cache first to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      refetch();
      
      // Also refresh debug data
      fetchDebugOrders();
    } else {
      toast.error('Configure seu perfil de vendedor primeiro');
    }
  }, [vendorProfileStatus, queryClient, refetch, fetchDebugOrders]);
  
  // Function to force a hard refresh - completely clear cache
  const forceRefresh = useCallback(async () => {
    if (vendorProfileStatus === 'found') {
      toast.info('Forçando atualização completa...');
      
      try {
        // Clear React Query cache completely for vendorOrders
        queryClient.removeQueries({ queryKey: ['vendorOrders'] });
        
        // Re-run vendor diagnostics
        const profile = await getVendorProfile();
        if (profile) {
          const diagnostics = await runVendorDiagnostics();
          setDiagnosticResults(diagnostics);
          
          // Fetch orders directly with debug mode and avoid caching
          const debugResult = await fetchDirectVendorOrdersWithDebug(
            profile.id, 
            undefined,
            true
          );
          setDebugData(debugResult);
          
          console.log("🔍 [forceRefresh] Direct fetch results:", {
            orderCount: debugResult?.orders?.length || 0,
            vendorProductsCount: debugResult?.debug?.vendorProductsCount || 0,
            orderItemsCount: debugResult?.debug?.orderItemsCount || 0
          });
          
          // Update UI with diagnostic info
          if (debugResult.debug) {
            toast.info(`Diagnóstico: ${debugResult.debug.vendorProductsCount} produtos, ${debugResult.debug.orderItemsCount || 0} itens de pedido`);
            
            // If orders were found, show success message
            if (debugResult.orders && debugResult.orders.length > 0) {
              toast.success(`${debugResult.orders.length} pedidos encontrados!`);
              
              // Immediately update the order list
              queryClient.setQueryData(['vendorOrders'], debugResult.orders);
            }
          }
          
          // Refetch orders after cache clear
          setTimeout(() => {
            refetch();
          }, 500);
        }
      } catch (error) {
        console.error("🚫 [useVendorOrders] Error during force refresh:", error);
        toast.error('Erro ao atualizar dados');
      }
    }
  }, [vendorProfileStatus, queryClient, refetch]);
  
  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev);
    if (!debugMode) {
      toast.info('Modo de depuração ativado');
      // Fetch debug data when enabling
      fetchDebugOrders();
    } else {
      toast.info('Modo de depuração desativado');
    }
  }, [debugMode, fetchDebugOrders]);

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
    isFixingVendorStatus,
    debugMode,
    debugData,
    toggleDebugMode,
    forceRefresh
  };
};
