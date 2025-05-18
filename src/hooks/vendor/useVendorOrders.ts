
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
        const profile = await getVendorProfile();
        if (profile) {
          setVendorProfileStatus('found');
          console.log("Vendor profile found:", profile.nome_loja);
          console.log("Vendor ID:", profile.id);
          console.log("Vendor usuario_id:", profile.usuario_id);
          console.log("Vendor status:", profile.status || 'unknown');
          
          // Run diagnostics when profile is found
          const diagnostics = await runVendorDiagnostics();
          setDiagnosticResults(diagnostics);
          console.log("Diagnostics completed:", diagnostics);
          
          // Check if vendor status is pending, which might be preventing orders from showing
          if (profile.status === 'pendente') {
            console.warn("⚠️ Vendor status is 'pendente', which may be preventing orders from displaying");
            
            // Auto-fix vendor status after a short delay
            setTimeout(async () => {
              await fixVendorStatus(profile.id);
            }, 1500);
          }
        } else {
          setVendorProfileStatus('not_found');
          console.error("No vendor profile found for current user");
          toast.error("Perfil de vendedor não encontrado", {
            description: "Configure seu perfil de vendedor para acessar esta funcionalidade"
          });
        }
      } catch (error) {
        console.error("Error checking vendor profile:", error);
        setVendorProfileStatus('not_found');
      }
    };
    
    checkVendorProfile();
  }, []);
  
  // Function to fix vendor status if needed
  const fixVendorStatus = async (vendorId: string) => {
    try {
      setIsFixingVendorStatus(true);
      
      console.log("Attempting to fix vendor status to 'ativo'");
      const result = await updateVendorStatus(vendorId, 'ativo');
      
      if (result.success) {
        toast.success("Status do vendedor atualizado", {
          description: "Status atualizado de 'pendente' para 'ativo'"
        });
        
        // Wait a moment before refreshing
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
          refetch();
        }, 1000);
      } else {
        console.error("Failed to update vendor status:", result.error);
      }
      
      setIsFixingVendorStatus(false);
    } catch (error) {
      console.error("Error fixing vendor status:", error);
      setIsFixingVendorStatus(false);
    }
  };
  
  // Check and fix profile role if needed
  useEffect(() => {
    const fixProfileRole = async () => {
      try {
        if (vendorProfileStatus === 'found') {
          const updated = await ensureVendorProfileRole();
          setProfileRoleFixed(updated);
          if (updated) {
            toast.success('Perfil de vendedor configurado com sucesso');
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
          }
        }
      } catch (error) {
        console.error("Error fixing profile role:", error);
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
      console.log("Fetching vendor orders from service...");
      const results = await getVendorOrders();
      console.log(`Fetched ${results.length} vendor orders`);
      
      // Additional check for debugging if no orders were found
      if (results.length === 0) {
        const profile = await getVendorProfile();
        if (profile) {
          console.log("Vendor profile re-checked:", {
            id: profile.id,
            nome_loja: profile.nome_loja,
            usuario_id: profile.usuario_id,
            status: profile.status || 'unknown'
          });
          
          // If status is pending, log a warning
          if (profile.status === 'pendente') {
            console.warn("⚠️ Vendor has status 'pendente', which may be preventing orders from showing");
          }
        }
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
      console.log("Automatically refreshing vendor orders");
      refetch();
    }
  }, [refetch, profileRoleFixed, vendorProfileStatus, isFixingVendorStatus]);
  
  const handleRefresh = () => {
    if (vendorProfileStatus === 'found') {
      toast.info('Atualizando lista de pedidos...');
      console.log("Manually refreshing vendor orders");
      
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
