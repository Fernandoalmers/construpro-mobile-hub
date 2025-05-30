
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorPedidos, migrateOrdersToPedidos, type Pedido } from '@/services/vendor/orders/pedidosService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { supabase } from '@/integrations/supabase/client';

// Tipos para as novas funções
interface SyncIntegrityCheck {
  total_orders: number;
  total_pedidos: number;
  missing_pedidos: number;
  sync_status: 'SYNC_OK' | 'SYNC_WARNING' | 'SYNC_CRITICAL';
  last_check: string;
}

export const usePedidosVendor = (
  limit: number = 20,
  offset: number = 0,
  statusFilter?: string
) => {
  const queryClient = useQueryClient();
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncIntegrityCheck | null>(null);
  
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
        console.error("Erro ao verificar perfil do vendedor:", error);
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
        return results;
      } catch (error) {
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('autenticado')) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else {
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
  
  // Função para verificar integridade da sincronização
  const checkSyncIntegrity = useCallback(async () => {
    if (vendorProfileStatus !== 'found') return;
    
    setIsCheckingSync(true);
    try {
      const { data, error } = await supabase.rpc('check_sync_integrity');
      
      if (error) {
        console.error('Erro ao verificar integridade:', error);
        toast.error('Erro ao verificar sincronização');
        return;
      }
      
      if (data && data.length > 0) {
        const result = data[0] as SyncIntegrityCheck;
        setSyncStatus(result);
        
        // Notificar se há problemas
        if (result.sync_status === 'SYNC_CRITICAL') {
          toast.error(`Sincronização crítica: ${result.missing_pedidos} pedidos não sincronizados!`);
        } else if (result.sync_status === 'SYNC_WARNING') {
          toast.warning(`Aviso de sincronização: ${result.missing_pedidos} pedidos não sincronizados`);
        } else {
          console.log('Sincronização OK');
        }
      }
    } catch (error) {
      console.error('Erro inesperado na verificação:', error);
    } finally {
      setIsCheckingSync(false);
    }
  }, [vendorProfileStatus]);
  
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
    setIsMigrating(true);
    toast.loading('Executando migração e sincronização...');
    
    try {
      // Primeiro executar a migração de pedidos perdidos
      const { data: migrationData, error: migrationError } = await supabase.rpc('migrate_missing_orders_to_pedidos');
      
      if (migrationError) {
        throw new Error(migrationError.message);
      }
      
      const migratedCount = migrationData || 0;
      
      if (migratedCount > 0) {
        toast.success(`Migração executada com sucesso! ${migratedCount} pedidos sincronizados.`);
      } else {
        toast.success('Sincronização verificada. Todos os pedidos já estão atualizados.');
      }
      
      // Verificar integridade após migração
      setTimeout(() => {
        checkSyncIntegrity();
        queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
        refetch();
      }, 1000);
      
    } catch (error) {
      console.error('Erro na migração:', error);
      toast.error('Erro durante a sincronização de pedidos');
    } finally {
      setIsMigrating(false);
    }
  }, [queryClient, refetch, checkSyncIntegrity]);

  return {
    pedidos,
    isLoading,
    error,
    refetch,
    isRefetching,
    handleRefresh,
    vendorProfileStatus,
    isMigrating,
    handleMigration,
    forceRefresh: handleRefresh,
    // Novas propriedades para monitoramento
    syncStatus,
    isCheckingSync,
    checkSyncIntegrity
  };
};
