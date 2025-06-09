import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { loyaltyService } from '@/services/admin/loyaltyService';
import LoyaltyStatsCards from './LoyaltyStatsCards';
import UserRankingTable from './UserRankingTable';
import RecentTransactionsTable from './RecentTransactionsTable';
import VendorAdjustmentsTable from './VendorAdjustmentsTable';
import VendorAdjustmentsSummaryTable from './VendorAdjustmentsSummaryTable';
import DataIntegrityIndicator from './DataIntegrityIndicator';
import RealtimeIndicator from './RealtimeIndicator';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bug, Search } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AdminLoyaltyDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [investigationMode, setInvestigationMode] = useState(false);
  const queryClient = useQueryClient();

  console.log('🚨 [Dashboard] === INVESTIGAÇÃO CRÍTICA DO DASHBOARD ===');
  console.log('🚨 [Dashboard] Timestamp:', new Date().toISOString());
  console.log('🚨 [Dashboard] Refresh key:', refreshKey);
  console.log('🚨 [Dashboard] Investigation mode:', investigationMode);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['loyalty-stats', refreshKey],
    queryFn: () => {
      console.log('📊 [Dashboard] Fetching loyalty stats...');
      return loyaltyService.getLoyaltyStats();
    },
    staleTime: 0,
    refetchOnMount: true,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching loyalty stats:', error);
      }
    }
  });

  const {
    data: userRanking,
    isLoading: rankingLoading,
    error: rankingError
  } = useQuery({
    queryKey: ['user-ranking', refreshKey],
    queryFn: () => {
      console.log('👥 [Dashboard] Fetching user ranking...');
      return loyaltyService.getUserRanking(10);
    },
    staleTime: 0,
    refetchOnMount: true,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching user ranking:', error);
      }
    }
  });

  const {
    data: recentTransactions,
    isLoading: transactionsLoading,
    error: transactionsError
  } = useQuery({
    queryKey: ['recent-transactions', refreshKey],
    queryFn: () => {
      console.log('💳 [Dashboard] Fetching recent transactions...');
      return loyaltyService.getRecentTransactions(20);
    },
    staleTime: 0,
    refetchOnMount: true,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching recent transactions:', error);
      }
    }
  });

  const {
    data: vendorAdjustments,
    isLoading: adjustmentsLoading,
    error: adjustmentsError
  } = useQuery({
    queryKey: ['vendor-adjustments', refreshKey],
    queryFn: () => {
      console.log('🔧 [Dashboard] === FETCHING VENDOR ADJUSTMENTS (NO LIMIT) ===');
      console.log('🔧 [Dashboard] Getting ALL data for consistency with summary');
      // Get ALL data, apply UI limit later if needed
      return loyaltyService.getVendorAdjustments();
    },
    staleTime: 0,
    refetchOnMount: true,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching vendor adjustments:', error);
      }
    }
  });

  const {
    data: vendorSummaries,
    isLoading: summariesLoading,
    error: summariesError,
    refetch: refetchSummaries,
    dataUpdatedAt: summariesUpdatedAt,
    isFetching: summariesFetching
  } = useQuery({
    queryKey: ['vendor-adjustments-summary', refreshKey],
    queryFn: () => {
      console.log('🚨 [Dashboard] === INVESTIGAÇÃO CRÍTICA DO SUMMARY QUERY ===');
      console.log('🚨 [Dashboard] Executando query para vendor adjustments summary');
      console.log('🚨 [Dashboard] Query timestamp:', new Date().toISOString());
      console.log('🚨 [Dashboard] Refresh key na query:', refreshKey);
      
      const startTime = Date.now();
      const result = loyaltyService.getVendorAdjustmentsSummary();
      
      result.then(data => {
        const endTime = Date.now();
        console.log('🚨 [Dashboard] === RESULTADO DA QUERY RECEBIDO ===');
        console.log(`🚨 [Dashboard] Tempo de execução: ${endTime - startTime}ms`);
        console.log('🚨 [Dashboard] Dados retornados pela query:', data);
        console.log('🚨 [Dashboard] Tipo dos dados:', typeof data);
        console.log('🚨 [Dashboard] É array:', Array.isArray(data));
        console.log('🚨 [Dashboard] Length:', data?.length || 0);
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('🚨 [Dashboard] Nomes dos vendedores na query:', data.map(v => v.vendedor_nome));
          
          const maisReal = data.find(v => v.vendedor_nome?.toLowerCase().includes('mais real'));
          const beaba = data.find(v => v.vendedor_nome?.toLowerCase().includes('beaba'));
          
          console.log('🚨 [Dashboard] BUSCA POR VENDEDORES ESPECÍFICOS:');
          console.log('  - Mais Real encontrado:', !!maisReal, maisReal || 'não encontrado');
          console.log('  - Beaba encontrado:', !!beaba, beaba || 'não encontrado');
        } else {
          console.log('🚨 [Dashboard] PROBLEMA: Query retornou dados inválidos!');
        }
      }).catch(error => {
        console.error('🚨 [Dashboard] ERRO NA QUERY:', error);
      });
      
      return result;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
    meta: {
      onError: (error: any) => {
        console.error('🚨 [Dashboard] ERRO NO META DA QUERY:', error);
      }
    }
  });

  // INVESTIGAÇÃO CRÍTICA DOS DADOS RECEBIDOS
  console.log('🚨 [Dashboard] === INVESTIGAÇÃO DO ESTADO DOS DADOS ===');
  console.log('🚨 [Dashboard] Vendor summaries state:', {
    data: vendorSummaries,
    dataType: typeof vendorSummaries,
    isArray: Array.isArray(vendorSummaries),
    length: vendorSummaries?.length || 0,
    isLoading: summariesLoading,
    isFetching: summariesFetching,
    error: summariesError?.message || null,
    dataUpdatedAt: summariesUpdatedAt ? new Date(summariesUpdatedAt).toISOString() : 'never',
    hasData: !!vendorSummaries && Array.isArray(vendorSummaries) && vendorSummaries.length > 0
  });

  // ANÁLISE ESPECÍFICA DOS DADOS
  if (vendorSummaries) {
    console.log('🚨 [Dashboard] === ANÁLISE DETALHADA DOS DADOS RECEBIDOS ===');
    if (Array.isArray(vendorSummaries)) {
      console.log(`🚨 [Dashboard] Array válido com ${vendorSummaries.length} elementos`);
      
      vendorSummaries.forEach((summary, index) => {
        console.log(`🚨 [Dashboard] Elemento ${index + 1}:`, {
          vendedor_id: summary.vendedor_id,
          vendedor_nome: summary.vendedor_nome,
          total_ajustes: summary.total_ajustes
        });
        
        if (summary.vendedor_nome?.toLowerCase().includes('mais real')) {
          console.log('🎯 [Dashboard] *** MAIS REAL ENCONTRADO NO DASHBOARD! ***', summary);
        }
      });
      
      const maisRealInDashboard = vendorSummaries.find(v => v.vendedor_nome?.toLowerCase().includes('mais real'));
      const beabaInDashboard = vendorSummaries.find(v => v.vendedor_nome?.toLowerCase().includes('beaba'));
      
      console.log('🚨 [Dashboard] RESULTADO DA VERIFICAÇÃO NO DASHBOARD:');
      console.log(`  - Mais Real no dashboard: ${!!maisRealInDashboard}`);
      console.log(`  - Beaba no dashboard: ${!!beabaInDashboard}`);
      
      if (!maisRealInDashboard) {
        console.log('❌ [Dashboard] PROBLEMA CRÍTICO: Mais Real não está nos dados do dashboard!');
        console.log('🚨 [Dashboard] Vendedores disponíveis:', vendorSummaries.map(v => v.vendedor_nome));
      }
    } else {
      console.log('❌ [Dashboard] PROBLEMA: vendorSummaries não é um array!', vendorSummaries);
    }
  } else {
    console.log('❌ [Dashboard] PROBLEMA: vendorSummaries é null/undefined');
  }

  // CRITICAL DEBUG: Compare data between both queries
  console.log('🎯 [Dashboard] === VENDOR DATA ANALYSIS ===');
  console.log('🎯 [Dashboard] Vendor summaries state:', {
    count: vendorSummaries?.length || 0,
    loading: summariesLoading,
    error: summariesError?.message || null,
    vendors: vendorSummaries?.map(v => `${v.vendedor_nome} (${v.total_ajustes} adjustments)`) || []
  });

  console.log('🎯 [Dashboard] Vendor adjustments state:', {
    count: vendorAdjustments?.length || 0,
    loading: adjustmentsLoading,
    error: adjustmentsError?.message || null,
    uniqueVendors: vendorAdjustments ? [...new Set(vendorAdjustments.map(adj => adj.vendedor_nome))].length : 0
  });

  // CRITICAL DEBUG: Enhanced logging
  console.log('🎯 [Dashboard] === VENDOR SUMMARIES STATE ANALYSIS ===');
  console.log('🎯 [Dashboard] Vendor summaries state:', {
    count: vendorSummaries?.length || 0,
    loading: summariesLoading,
    error: summariesError?.message || null,
    hasData: !!vendorSummaries && vendorSummaries.length > 0,
    vendors: vendorSummaries?.map(v => `${v.vendedor_nome} (${v.total_ajustes} adjustments)`) || []
  });

  console.log('🎯 [Dashboard] === VENDOR ADJUSTMENTS STATE ANALYSIS ===');
  console.log('🎯 [Dashboard] Vendor adjustments state:', {
    count: vendorAdjustments?.length || 0,
    loading: adjustmentsLoading,
    error: adjustmentsError?.message || null,
    adjustments: vendorAdjustments?.length || 0
  });

  console.log('🔍 [Dashboard] === DETAILED DATA INSPECTION ===');
  console.log('🔍 [Dashboard] Detailed vendor summaries data:', vendorSummaries);
  console.log('🔍 [Dashboard] Detailed vendor adjustments data (first 3):', vendorAdjustments?.slice(0, 3) || []);

  // CRITICAL DEBUG: Compare data between both queries
  console.log('📊 [Dashboard] === DATA COMPARISON ANALYSIS ===');
  console.log(`  - getVendorAdjustments returned: ${vendorAdjustments?.length || 0} adjustments`);
  console.log(`  - getVendorAdjustmentsSummary returned: ${vendorSummaries?.length || 0} vendor summaries`);
  
  // Total adjustments from summaries
  const totalAdjustmentsFromSummary = vendorSummaries?.reduce((sum, v) => sum + v.total_ajustes, 0) || 0;
  console.log(`  - Total adjustments calculated from summaries: ${totalAdjustmentsFromSummary}`);
  console.log(`  - Expected: Both functions should process ALL data consistently`);

  // Log unique vendors in adjustments data
  if (vendorAdjustments && vendorAdjustments.length > 0) {
    const uniqueVendorsInAdjustments = [...new Set(vendorAdjustments.map(adj => adj.vendedor_nome))];
    console.log('🏪 [Dashboard] Unique vendors in adjustments data:', uniqueVendorsInAdjustments);
  }

  // Log vendor breakdown from adjustments
  if (vendorAdjustments && vendorAdjustments.length > 0) {
    const vendorCounts = vendorAdjustments.reduce((acc, adj) => {
      acc[adj.vendedor_nome] = (acc[adj.vendedor_nome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📊 [Dashboard] Vendor breakdown from adjustments:', vendorCounts);
  }

  // Real-time subscription setup
  useEffect(() => {
    console.log('🔄 [Dashboard] Setting up real-time subscriptions...');
    setIsRealtimeConnected(true);

    try {
      const unsubscribe = loyaltyService.subscribeToLoyaltyUpdates(
        () => {
          console.log('📊 [Dashboard] Stats updated via real-time');
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
          queryClient.invalidateQueries({ queryKey: ['user-ranking'] });
        },
        () => {
          console.log('💳 [Dashboard] Transactions updated via real-time');
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
        },
        () => {
          console.log('🔧 [Dashboard] Adjustments updated via real-time');
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['vendor-adjustments'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-adjustments-summary'] });
        }
      );

      return () => {
        console.log('🔄 [Dashboard] Cleaning up real-time subscriptions...');
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
        setIsRealtimeConnected(false);
      };
    } catch (error) {
      console.error('❌ [Dashboard] Error setting up real-time subscriptions:', error);
      setIsRealtimeConnected(false);
      toast.error('Erro ao configurar atualizações em tempo real');
    }
  }, [queryClient]);

  const handleRefresh = async () => {
    console.log('🚨 [Dashboard] === REFRESH MANUAL COM INVESTIGAÇÃO ===');
    setIsManualRefreshing(true);
    
    try {
      console.log('🚨 [Dashboard] Limpando cache...');
      await queryClient.removeQueries({ queryKey: ['vendor-adjustments-summary'] });
      
      console.log('🚨 [Dashboard] Forçando refresh...');
      setRefreshKey(prev => {
        const newKey = prev + 1;
        console.log(`🚨 [Dashboard] Novo refresh key: ${newKey}`);
        return newKey;
      });
      
      setLastUpdate(new Date());
      toast.success('🔍 Refresh com investigação ativado');
    } catch (error) {
      console.error('🚨 [Dashboard] Erro no refresh:', error);
      toast.error('Erro no refresh');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleInvestigationRefresh = async () => {
    console.log('🚨 [Dashboard] === REFRESH DE INVESTIGAÇÃO CRÍTICA ===');
    setInvestigationMode(true);
    
    try {
      console.log('🚨 [Dashboard] Executando refresh investigativo...');
      const result = await refetchSummaries();
      console.log('🚨 [Dashboard] Resultado do refresh investigativo:', result);
      
      toast.success('🔍 Investigação completa - verifique o console');
    } catch (error) {
      console.error('🚨 [Dashboard] Erro na investigação:', error);
      toast.error('Erro na investigação');
    }
  };

  // Handle all errors collectively
  useEffect(() => {
    if (statsError) {
      console.error('❌ [Dashboard] Stats error:', statsError);
      toast.error('Erro ao carregar estatísticas de fidelidade');
    }
    if (rankingError) {
      console.error('❌ [Dashboard] Ranking error:', rankingError);
      toast.error('Erro ao carregar ranking de usuários');
    }
    if (transactionsError) {
      console.error('❌ [Dashboard] Transactions error:', transactionsError);
      toast.error('Erro ao carregar transações recentes');
    }
    if (adjustmentsError) {
      console.error('❌ [Dashboard] Adjustments error:', adjustmentsError);
      toast.error('Erro ao carregar ajustes de vendedores');
    }
    if (summariesError) {
      console.error('❌ [Dashboard] Summaries error:', summariesError);
      toast.error('Erro ao carregar resumo de vendedores');
    }
  }, [statsError, rankingError, transactionsError, adjustmentsError, summariesError]);

  // Show loading state if any critical data is loading
  if (statsLoading) {
    console.log('⏳ [Dashboard] Showing loading state for stats');
    return (
      <AdminLayout currentSection="Fidelidade">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construPro-blue"></div>
          <span className="ml-4 text-gray-600">Carregando dashboard de fidelidade...</span>
        </div>
      </AdminLayout>
    );
  }

  console.log('🎯 [Dashboard] === DASHBOARD RENDER END ===');

  return (
    <ErrorBoundary>
      <AdminLayout currentSection="Fidelidade">
        <div className="space-y-6">
          {/* Header com investigação */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard do Clube de Fidelidade
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe pontos, usuários e transações do programa de fidelidade
              </p>
              
              {/* PAINEL DE INVESTIGAÇÃO CRÍTICA */}
              <div className="text-xs text-gray-500 mt-3 font-mono bg-red-50 border border-red-200 p-3 rounded">
                <div className="font-bold text-red-800 mb-2">🚨 INVESTIGAÇÃO CRÍTICA ATIVA</div>
                <div className="space-y-1 text-red-700">
                  <div>Summaries: {vendorSummaries?.length || 0} | Loading: {summariesLoading.toString()} | Fetching: {summariesFetching.toString()}</div>
                  <div>Refresh key: {refreshKey} | Investigation: {investigationMode.toString()}</div>
                  <div>Data updated: {summariesUpdatedAt ? new Date(summariesUpdatedAt).toLocaleTimeString() : 'never'}</div>
                  <div>Mais Real presente: {vendorSummaries?.find(v => v.vendedor_nome?.toLowerCase().includes('mais real')) ? 'SIM ✅' : 'NÃO ❌'}</div>
                  <div>Timestamp: {new Date().toISOString()}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeIndicator 
                isConnected={isRealtimeConnected} 
                lastUpdate={lastUpdate} 
              />
              <Button 
                onClick={() => setDebugMode(!debugMode)}
                variant="outline" 
                className="gap-2"
              >
                <Bug className="h-4 w-4" />
                Debug: {debugMode ? 'ON' : 'OFF'}
              </Button>
              <Button 
                onClick={() => setInvestigationMode(!investigationMode)}
                variant="outline" 
                className="gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <Search className="h-4 w-4" />
                Investigação: {investigationMode ? 'ON' : 'OFF'}
              </Button>
              <Button 
                onClick={handleInvestigationRefresh} 
                variant="outline" 
                className="gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4" />
                🔍 Investigar
              </Button>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="gap-2"
                disabled={isManualRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                {isManualRefreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </div>

          {/* Debug Panel estendido */}
          {(debugMode || investigationMode) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">🔍 Informações de Investigação</h3>
              <div className="text-xs text-yellow-700 space-y-2 font-mono">
                <div><strong>Vendor Summaries:</strong> {vendorSummaries?.length || 0} items | Loading: {summariesLoading.toString()} | Fetching: {summariesFetching.toString()}</div>
                <div><strong>Query State:</strong> Error: {summariesError?.message || 'none'} | Updated: {summariesUpdatedAt ? new Date(summariesUpdatedAt).toLocaleString() : 'never'}</div>
                <div><strong>Data Type:</strong> {typeof vendorSummaries} | Is Array: {Array.isArray(vendorSummaries).toString()}</div>
                <div><strong>Refresh Key:</strong> {refreshKey} | Investigation Mode: {investigationMode.toString()}</div>
                
                {vendorSummaries && (
                  <>
                    <div><strong>Vendor Names:</strong> {vendorSummaries.map(v => `"${v.vendedor_nome}"`).join(', ')}</div>
                    <div><strong>Mais Real Check:</strong> {vendorSummaries.find(v => v.vendedor_nome?.toLowerCase().includes('mais real')) ? 'FOUND ✅' : 'MISSING ❌'}</div>
                    <div><strong>Beaba Check:</strong> {vendorSummaries.find(v => v.vendedor_nome?.toLowerCase().includes('beaba')) ? 'FOUND ✅' : 'MISSING ❌'}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <LoyaltyStatsCards 
            stats={stats || {
              totalUsers: 0,
              activeUsers: 0,
              totalPointsInCirculation: 0,
              averagePointsPerUser: 0,
              topUserPoints: 0,
              totalTransactions: 0,
              totalAdjustments: 0
            }} 
            isLoading={statsLoading} 
          />

          {/* Data Integrity Indicator */}
          <DataIntegrityIndicator />

          {/* Vendor Adjustments Summary */}
          <VendorAdjustmentsSummaryTable 
            summaries={vendorSummaries || []} 
            isLoading={summariesLoading || summariesFetching} 
          />

          {/* Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Ranking */}
            <UserRankingTable 
              users={userRanking || []} 
              isLoading={rankingLoading} 
            />

            {/* Recent Transactions */}
            <RecentTransactionsTable 
              transactions={recentTransactions || []} 
              isLoading={transactionsLoading} 
            />
          </div>

          {/* Vendor Adjustments */}
          <VendorAdjustmentsTable 
            adjustments={vendorAdjustments ? vendorAdjustments.slice(0, 20) : []} 
            isLoading={adjustmentsLoading} 
          />
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
};

export default AdminLoyaltyDashboard;
