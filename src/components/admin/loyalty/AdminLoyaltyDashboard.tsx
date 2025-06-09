import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { loyaltyService } from '@/services/admin/loyaltyService';
import LoyaltyStatsCards from './LoyaltyStatsCards';
import UserRankingTable from './UserRankingTable';
import RecentTransactionsTable from './RecentTransactionsTable';
import VendorAdjustmentsTable from './VendorAdjustmentsTable';
import VendorAdjustmentsSummaryTable from './VendorAdjustmentsSummaryTable';
import RealtimeIndicator from './RealtimeIndicator';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bug } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AdminLoyaltyDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [debugMode, setDebugMode] = useState(false);
  const queryClient = useQueryClient();

  console.log('AdminLoyaltyDashboard rendering with refreshKey:', refreshKey);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['loyalty-stats', refreshKey],
    queryFn: () => {
      console.log('Fetching loyalty stats...');
      return loyaltyService.getLoyaltyStats();
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching loyalty stats:', error);
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
      console.log('Fetching user ranking...');
      return loyaltyService.getUserRanking(10);
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching user ranking:', error);
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
      console.log('Fetching recent transactions...');
      return loyaltyService.getRecentTransactions(20);
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching recent transactions:', error);
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
      console.log('Fetching vendor adjustments...');
      return loyaltyService.getVendorAdjustments(20);
    },
    meta: {
      onError: (error: any) => {
        console.error('Error fetching vendor adjustments:', error);
      }
    }
  });

  const {
    data: vendorSummaries,
    isLoading: summariesLoading,
    error: summariesError
  } = useQuery({
    queryKey: ['vendor-adjustments-summary', refreshKey, Date.now()], // Force fresh data with timestamp
    queryFn: () => {
      console.log('🔄 [Dashboard] Fetching vendor adjustments summary with fresh cache...');
      return loyaltyService.getVendorAdjustmentsSummary();
    },
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching vendor adjustments summary:', error);
      }
    }
  });

  console.log('🎯 [Dashboard] Vendor summaries state:', {
    data: vendorSummaries,
    loading: summariesLoading,
    error: summariesError,
    count: vendorSummaries?.length || 0
  });

  // Real-time subscription setup
  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    setIsRealtimeConnected(true);

    try {
      const unsubscribe = loyaltyService.subscribeToLoyaltyUpdates(
        () => {
          console.log('Stats updated via real-time');
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['loyalty-stats'] });
          queryClient.invalidateQueries({ queryKey: ['user-ranking'] });
        },
        () => {
          console.log('Transactions updated via real-time');
          setLastUpdate(new Date());
          queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
        },
        () => {
          console.log('Adjustments updated via real-time');
          setLastUpdate(new Date());
          queryClient.removeQueries({ queryKey: ['vendor-adjustments'] });
          queryClient.removeQueries({ queryKey: ['vendor-adjustments-summary'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-adjustments'] });
          queryClient.invalidateQueries({ queryKey: ['vendor-adjustments-summary'] });
        }
      );

      return () => {
        console.log('Cleaning up real-time subscriptions...');
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
        setIsRealtimeConnected(false);
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setIsRealtimeConnected(false);
      toast.error('Erro ao configurar atualizações em tempo real');
    }
  }, [queryClient]);

  const handleRefresh = () => {
    console.log('🔄 [Dashboard] Manual refresh triggered - clearing ALL caches');
    
    // Clear all loyalty-related caches
    queryClient.removeQueries({ queryKey: ['loyalty-stats'] });
    queryClient.removeQueries({ queryKey: ['user-ranking'] });
    queryClient.removeQueries({ queryKey: ['recent-transactions'] });
    queryClient.removeQueries({ queryKey: ['vendor-adjustments'] });
    queryClient.removeQueries({ queryKey: ['vendor-adjustments-summary'] });
    
    // Force refresh with new key AND timestamp
    const newRefreshKey = Date.now();
    setRefreshKey(newRefreshKey);
    setLastUpdate(new Date());
    
    console.log('🔄 [Dashboard] New refresh key:', newRefreshKey);
    toast.success('Cache limpo e dados atualizados');
  };

  const handleForceDebug = async () => {
    console.log('🐛 [Dashboard] Force debug triggered');
    setDebugMode(true);
    
    try {
      // Directly call the service to bypass React Query
      const directResult = await loyaltyService.getVendorAdjustmentsSummary();
      console.log('🐛 [Dashboard] Direct service call result:', directResult);
      
      // Show raw data in console and toast
      console.table(directResult);
      toast.success(`Debug: Encontrados ${directResult.length} vendedores diretamente`);
      
      // Force a complete refresh
      handleRefresh();
    } catch (error) {
      console.error('🐛 [Dashboard] Debug error:', error);
      toast.error('Erro no debug');
    }
    
    setTimeout(() => setDebugMode(false), 3000);
  };

  // Handle all errors collectively
  useEffect(() => {
    if (statsError) {
      console.error('Stats error:', statsError);
      toast.error('Erro ao carregar estatísticas de fidelidade');
    }
    if (rankingError) {
      console.error('Ranking error:', rankingError);
      toast.error('Erro ao carregar ranking de usuários');
    }
    if (transactionsError) {
      console.error('Transactions error:', transactionsError);
      toast.error('Erro ao carregar transações recentes');
    }
    if (adjustmentsError) {
      console.error('Adjustments error:', adjustmentsError);
      toast.error('Erro ao carregar ajustes de vendedores');
    }
    if (summariesError) {
      console.error('Summaries error:', summariesError);
      toast.error('Erro ao carregar resumo de vendedores');
    }
  }, [statsError, rankingError, transactionsError, adjustmentsError, summariesError]);

  // Show loading state if any critical data is loading
  if (statsLoading) {
    return (
      <AdminLayout currentSection="Fidelidade">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construPro-blue"></div>
          <span className="ml-4 text-gray-600">Carregando dashboard de fidelidade...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <ErrorBoundary>
      <AdminLayout currentSection="Fidelidade">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard do Clube de Fidelidade
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe pontos, usuários e transações do programa de fidelidade
              </p>
              {debugMode && (
                <p className="text-orange-600 mt-1 font-medium">
                  🐛 Modo debug ativo - Verifique o console
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <RealtimeIndicator 
                isConnected={isRealtimeConnected} 
                lastUpdate={lastUpdate} 
              />
              <Button onClick={handleForceDebug} variant="outline" className="gap-2">
                <Bug className="h-4 w-4" />
                Debug
              </Button>
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Debug Info */}
          {debugMode && vendorSummaries && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-2">Debug Info:</h3>
              <p className="text-sm text-orange-700">
                Dados carregados: {vendorSummaries.length} vendedores encontrados
              </p>
              <details className="mt-2">
                <summary className="text-sm text-orange-700 cursor-pointer">Ver dados brutos</summary>
                <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-auto max-h-40">
                  {JSON.stringify(vendorSummaries, null, 2)}
                </pre>
              </details>
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

          {/* Vendor Adjustments Summary */}
          <VendorAdjustmentsSummaryTable 
            summaries={vendorSummaries || []} 
            isLoading={summariesLoading} 
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
            adjustments={vendorAdjustments || []} 
            isLoading={adjustmentsLoading} 
          />
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
};

export default AdminLoyaltyDashboard;
