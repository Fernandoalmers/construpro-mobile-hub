
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import { getVendorPedidos, migrateOrdersToPedidos, type Pedido } from '@/services/vendor/orders/pedidosService';
import { getVendorProfile } from '@/services/vendorProfileService';
import { supabase } from '@/integrations/supabase/client';

export const usePedidosVendor = () => {
  const queryClient = useQueryClient();
  const [vendorProfileStatus, setVendorProfileStatus] = useState<'checking' | 'found' | 'not_found'>('checking');
  const [isMigrating, setIsMigrating] = useState(false);
  
  console.log('🚀 [usePedidosVendor] HOOK CORRETO INICIALIZADO - Usando tabela pedidos');
  
  // Check if the vendor profile exists
  useEffect(() => {
    const checkVendorProfile = async () => {
      try {
        console.log("🔍 [usePedidosVendor] PROFILE CHECK - Verificando perfil do vendedor...");
        
        // First ensure user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("🚫 [usePedidosVendor] PROFILE CHECK - Usuário não autenticado:", userError);
          setVendorProfileStatus('not_found');
          return;
        }
        
        console.log("👤 [usePedidosVendor] PROFILE CHECK - Usuário autenticado:", user.id);
        
        const profile = await getVendorProfile();
        
        if (profile) {
          setVendorProfileStatus('found');
          console.log("✅ [usePedidosVendor] PROFILE CHECK - Perfil do vendedor encontrado:", {
            id: profile.id,
            nome_loja: profile.nome_loja,
            status: profile.status || 'unknown'
          });
        } else {
          setVendorProfileStatus('not_found');
          console.error("🚫 [usePedidosVendor] PROFILE CHECK - Nenhum perfil de vendedor encontrado para o usuário atual");
        }
      } catch (error) {
        console.error("🚫 [usePedidosVendor] PROFILE CHECK - Erro ao verificar perfil do vendedor:", error);
        setVendorProfileStatus('not_found');
      }
    };
    
    checkVendorProfile();
  }, []);
  
  // Fetch pedidos with improved error handling
  const { 
    data: pedidos = [], 
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['vendorPedidos'],
    queryFn: async () => {
      console.log("🔍 [usePedidosVendor] QUERY FUNCTION - Iniciando busca de pedidos da tabela pedidos...");
      
      try {
        // Verify authentication before proceeding
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error("🚫 [usePedidosVendor] QUERY FUNCTION - Falha na autenticação:", authError);
          throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        
        console.log("👤 [usePedidosVendor] QUERY FUNCTION - Usuário verificado para busca de pedidos:", user.id);
        
        // Log the start of pedidos fetching
        console.log("📞 [usePedidosVendor] QUERY FUNCTION - Chamando getVendorPedidos da tabela pedidos...");
        
        const results = await getVendorPedidos();
        
        console.log(`📊 [usePedidosVendor] QUERY FUNCTION - getVendorPedidos retornou ${results.length} resultados da tabela pedidos`);
        
        if (results.length > 0) {
          console.log("✅ [usePedidosVendor] QUERY FUNCTION - SUCESSO! Pedidos encontrados. Exemplo do primeiro pedido da tabela pedidos:", {
            id: results[0]?.id,
            status: results[0]?.status,
            items_count: results[0]?.itens?.length || 0,
            customer: results[0]?.cliente?.nome,
            total: results[0]?.valor_total,
            created_at: results[0]?.created_at
          });
          
          console.log("📋 [usePedidosVendor] QUERY FUNCTION - Todos os IDs dos pedidos da tabela pedidos:", results.map(p => p.id));
          
          // Detailed log of all pedidos
          results.forEach((pedido, index) => {
            console.log(`📋 [usePedidosVendor] QUERY FUNCTION - Pedido ${index + 1}:`, {
              id: pedido.id,
              vendedor_id: pedido.vendedor_id,
              usuario_id: pedido.usuario_id,
              status: pedido.status,
              valor_total: pedido.valor_total,
              cliente_nome: pedido.cliente?.nome,
              itens_count: pedido.itens?.length || 0
            });
          });
        } else {
          console.log("⚠️ [usePedidosVendor] QUERY FUNCTION - AVISO: Nenhum pedido encontrado na tabela pedidos - isto pode indicar:");
          console.log("   1. Vendedor não tem pedidos na tabela pedidos");
          console.log("   2. Dados ainda não foram migrados da tabela orders");
          console.log("   3. Problema na busca do vendedor ID");
          console.log("   4. Problema na query da tabela pedidos");
        }
        
        return results;
      } catch (error) {
        console.error("🚫 [usePedidosVendor] QUERY FUNCTION - Erro na queryFn:", error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('autenticado')) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else {
          toast.error('Erro ao carregar pedidos da tabela pedidos. Tente novamente.');
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
  
  // Debug effect to log changes in pedidos data
  useEffect(() => {
    console.log('🔄 [usePedidosVendor] DATA CHANGE - Pedidos data changed:', {
      count: pedidos?.length || 0,
      isLoading,
      hasError: !!error,
      vendorProfileStatus,
      firstPedidoId: pedidos?.[0]?.id
    });
    
    if (pedidos && pedidos.length > 0) {
      console.log('🎉 [usePedidosVendor] DATA CHANGE - PEDIDOS ENCONTRADOS! Carregados com sucesso da tabela pedidos');
    }
  }, [pedidos, isLoading, error, vendorProfileStatus]);
  
  const handleRefresh = useCallback(async () => {
    console.log('🔄 [usePedidosVendor] REFRESH - Manual refresh triggered');
    
    if (vendorProfileStatus === 'found') {
      // Check authentication before refresh
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      toast.info('Atualizando lista de pedidos da tabela pedidos...');
      console.log("🔄 [usePedidosVendor] REFRESH - Atualizando pedidos do vendedor manualmente da tabela pedidos");
      
      // Clear cache and refetch
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
      refetch();
    } else {
      toast.error('Configure seu perfil de vendedor primeiro');
    }
  }, [vendorProfileStatus, queryClient, refetch]);

  const handleMigration = useCallback(async () => {
    console.log('🔄 [usePedidosVendor] MIGRATION - Starting migration process');
    setIsMigrating(true);
    toast.loading('Migrando pedidos da tabela orders para pedidos...');
    
    try {
      const result = await migrateOrdersToPedidos();
      
      if (result.success) {
        console.log('✅ [usePedidosVendor] MIGRATION - Migration successful:', result);
        toast.success(`Migração executada com sucesso! ${result.count} pedidos migrados.`);
        // Refresh data after migration
        setTimeout(() => {
          console.log('🔄 [usePedidosVendor] MIGRATION - Refreshing data after migration');
          queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
          refetch();
        }, 1000);
      } else {
        console.error('❌ [usePedidosVendor] MIGRATION - Migration failed:', result);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('❌ [usePedidosVendor] MIGRATION - Erro na migração:', error);
      toast.error('Erro durante a migração de pedidos');
    } finally {
      setIsMigrating(false);
    }
  }, [queryClient, refetch]);

  console.log('📊 [usePedidosVendor] RETURN DATA - Hook returning data:', {
    pedidosCount: pedidos?.length || 0,
    isLoading,
    hasError: !!error,
    vendorProfileStatus,
    isMigrating
  });

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
    forceRefresh: handleRefresh
  };
};
