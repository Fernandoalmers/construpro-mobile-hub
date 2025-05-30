
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorPedidos, type Pedido } from '@/services/vendor/orders/pedidosService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { supabase } from '@/integrations/supabase/client';
import { useOrderSync } from './useOrderSync';

export const usePedidosVendor = (
  limit: number = 20,
  offset: number = 0,
  statusFilter?: string
) => {
  const queryClient = useQueryClient();
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  
  // Usar o hook de sincronização
  const {
    isSyncing,
    isCheckingIntegrity,
    syncStatus,
    checkSyncIntegrity,
    syncOrders,
    forceSyncOrders
  } = useOrderSync();
  
  // Check if the vendor profile exists
  useEffect(() => {
    const checkVendorProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setVendorProfileStatus('not_found');
          return;
        }
        
        const profile = await getVendorProfile();
        
        if (profile) {
          setVendorProfileStatus('found');
        } else {
          setVendorProfileStatus('not_found');
        }
      } catch (error) {
        console.error("❌ [usePedidosVendor] Erro ao verificar perfil do vendedor:", error);
        setVendorProfileStatus('not_found');
      }
    };
    
    checkVendorProfile();
  }, []);
  
  // Fetch pedidos with improved error handling and pagination
  const { 
    data: pedidos = [], 
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorPedidos', limit, offset, statusFilter],
    queryFn: async () => {
      try {
        // Verify authentication before proceeding
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        
        const results = await getVendorPedidos(limit, offset, statusFilter);
        console.log(`✅ [usePedidosVendor] Carregados ${results.length} pedidos`);
        return results;
      } catch (error) {
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('autenticado')) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else {
          console.error('❌ [usePedidosVendor] Erro ao carregar pedidos:', error);
          toast.error('Erro ao carregar pedidos. Tente novamente.');
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
    refetchInterval: 60000 // Auto refresh every 60 seconds
  });
  
  // Verificar integridade automaticamente quando carregado
  useEffect(() => {
    if (vendorProfileStatus === 'found') {
      checkSyncIntegrity();
    }
  }, [vendorProfileStatus, checkSyncIntegrity]);
  
  const handleRefresh = useCallback(async () => {
    if (vendorProfileStatus === 'found') {
      // Check authentication before refresh
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      toast.info('Atualizando lista de pedidos...');
      
      // Clear cache and refetch
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
      refetch();
      
      // Verificar integridade após refresh
      setTimeout(() => {
        checkSyncIntegrity();
      }, 1000);
    } else {
      toast.error('Configure seu perfil de vendedor primeiro');
    }
  }, [vendorProfileStatus, queryClient, refetch, checkSyncIntegrity]);

  const handleMigration = useCallback(async () => {
    const result = await syncOrders();
    
    if (result.success) {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
      refetch();
    }
    
    return result;
  }, [syncOrders, queryClient, refetch]);

  return {
    pedidos,
    isLoading,
    error,
    refetch,
    isRefetching,
    handleRefresh,
    vendorProfileStatus,
    isMigrating: isSyncing,
    handleMigration,
    forceRefresh: handleRefresh,
    // Novas propriedades para monitoramento melhorado
    syncStatus,
    isCheckingSync: isCheckingIntegrity,
    checkSyncIntegrity,
    forceSyncOrders
  };
};
