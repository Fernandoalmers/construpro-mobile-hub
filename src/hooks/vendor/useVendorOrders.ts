
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorOrders, VendorOrder } from '@/services/vendor/orders';
import { ensureVendorProfileRole } from '@/services/vendorProfileService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { runVendorDiagnostics } from '@/services/vendor/orders/utils/diagnosticUtils';

export const useVendorOrders = () => {
  const queryClient = useQueryClient();
  const [profileRoleFixed, setProfileRoleFixed] = useState<boolean | null>(null);
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  
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
          
          // Run diagnostics when profile is found
          const diagnostics = await runVendorDiagnostics();
          setDiagnosticResults(diagnostics);
          console.log("Diagnostics completed:", diagnostics);
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
            usuario_id: profile.usuario_id
          });
        }
      }
      
      return results;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 3, // Increase retries for more resilience
    enabled: vendorProfileStatus === 'found',
  });

  // Force refresh whenever the component mounts or profile role is fixed
  useEffect(() => {
    if (vendorProfileStatus === 'found') {
      console.log("Automatically refreshing vendor orders");
      refetch();
    }
  }, [refetch, profileRoleFixed, vendorProfileStatus]);
  
  const handleRefresh = () => {
    if (vendorProfileStatus === 'found') {
      toast.info('Atualizando lista de pedidos...');
      console.log("Manually refreshing vendor orders");
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
    diagnosticResults
  };
};
