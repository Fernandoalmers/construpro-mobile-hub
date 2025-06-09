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
import { RefreshCw, Bug } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AdminLoyaltyDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const queryClient = useQueryClient();

  console.log('🎯 [Dashboard] === DASHBOARD RENDER START ===');
  console.log('🎯 [Dashboard] Timestamp:', new Date().toISOString());
  console.log('🎯 [Dashboard] Rendering with refreshKey:', refreshKey);

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
      console.log('🔧 [Dashboard] === FETCHING VENDOR ADJUSTMENTS WITH EXPLICIT LIMIT ===');
      console.log('🔧 [Dashboard] Using limit: 20 for display table');
      // Apply limit only for the display table, not for data processing
      return loyaltyService.getVendorAdjustments(20);
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
    refetch: refetchSummaries
  } = useQuery({
    queryKey: ['vendor-adjustments-summary', refreshKey],
    queryFn: () => {
      console.log('🏪 [Dashboard] === EXECUTING VENDOR ADJUSTMENTS SUMMARY QUERY ===');
      console.log('🏪 [Dashboard] Summary processes ALL data without limits');
      console.log('🏪 [Dashboard] Query timestamp:', new Date().toISOString());
      return loyaltyService.getVendorAdjustmentsSummary();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching vendor adjustments summary:', error);
      }
    }
  });

  // ENHANCED DEBUG: Compare data between both queries
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

  // CRITICAL: Check for data consistency
  if (vendorSummaries && vendorAdjustments) {
    const summaryVendors = vendorSummaries.map(v => v.vendedor_nome).sort();
    const adjustmentVendors = [...new Set(vendorAdjustments.map(adj => adj.vendedor_nome))].sort();
    
    console.log('📊 [Dashboard] === DATA CONSISTENCY CHECK ===');
    console.log('  Summary vendors:', summaryVendors);
    console.log('  Adjustment vendors:', adjustmentVendors);
    console.log('  Vendors in summary but not in adjustments:', summaryVendors.filter(v => !adjustmentVendors.includes(v)));
    console.log('  Vendors in adjustments but not in summary:', adjustmentVendors.filter(v => !summaryVendors.includes(v)));
    
    // Check specifically for Mais Real
    const maisRealInSummary = vendorSummaries.find(v => v.vendedor_nome.includes('Mais Real'));
    const maisRealInAdjustments = vendorAdjustments.find(adj => adj.vendedor_nome.includes('Mais Real'));
    
    if (maisRealInSummary && !maisRealInAdjustments) {
      console.log('🚨 [Dashboard] CRITICAL: Mais Real found in summary but NOT in adjustments table - limit issue confirmed!');
    } else if (maisRealInSummary && maisRealInAdjustments) {
      console.log('✅ [Dashboard] SUCCESS: Mais Real found in both summary and adjustments');
    }
  }

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
    console.log('🔄 [Dashboard] === MANUAL REFRESH TRIGGERED ===');
    console.log('🔄 [Dashboard] Refresh timestamp:', new Date().toISOString());
    setIsManualRefreshing(true);
    
    try {
      console.log('🗑️ [Dashboard] Clearing ALL loyalty-related caches completely...');
      
      // Clear ALL loyalty-related caches completely
      await queryClient.removeQueries({ queryKey: ['loyalty-stats'] });
      await queryClient.removeQueries({ queryKey: ['user-ranking'] });
      await queryClient.removeQueries({ queryKey: ['recent-transactions'] });
      await queryClient.removeQueries({ queryKey: ['vendor-adjustments'] });
      await queryClient.removeQueries({ queryKey: ['vendor-adjustments-summary'] });
      
      console.log('🆔 [Dashboard] Incrementing refresh key to force fresh data fetch...');
      // Force immediate refresh with new key
      setRefreshKey(prev => {
        const newKey = prev + 1;
        console.log(`🔑 [Dashboard] Refresh key updated: ${prev} -> ${newKey}`);
        return newKey;
      });
      
      setLastUpdate(new Date());
      
      console.log('✅ [Dashboard] Cache cleared, forcing fresh data fetch...');
      toast.success('Dados atualizados - cache limpo e recarregando');
    } catch (error) {
      console.error('❌ [Dashboard] Error during manual refresh:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleDebugRefresh = async () => {
    console.log('🐛 [Dashboard] === DEBUG REFRESH TRIGGERED ===');
    try {
      console.log('🐛 [Dashboard] Forcing vendor summaries refetch...');
      const result = await refetchSummaries();
      console.log('🐛 [Dashboard] Debug refetch result:', result);
      toast.success('Debug refresh concluído - verifique o console');
    } catch (error) {
      console.error('❌ [Dashboard] Debug refresh error:', error);
      toast.error('Erro no debug refresh');
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
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard do Clube de Fidelidade
              </h1>
              <p className="text-gray-600 mt-1">
                Acompanhe pontos, usuários e transações do programa de fidelidade
              </p>
              {/* ENHANCED DEBUG INFO */}
              <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 p-2 rounded">
                <div>Debug: {vendorSummaries?.length || 0} vendedores no resumo | {vendorAdjustments?.length || 0} ajustes (limit: 20) | Refresh: {refreshKey}</div>
                <div>Loading: Summaries={summariesLoading.toString()} | Adjustments={adjustmentsLoading.toString()}</div>
                <div>Data consistency: {vendorSummaries && vendorAdjustments ? 'Both loaded' : 'Partial data'}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
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
                onClick={handleDebugRefresh} 
                variant="outline" 
                className="gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4" />
                Debug Refresh
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

          {/* Debug Panel */}
          {debugMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">🐛 Debug Information</h3>
              <div className="text-xs text-yellow-700 space-y-1 font-mono">
                <div>Vendor Summaries: {vendorSummaries?.length || 0} items | Loading: {summariesLoading.toString()}</div>
                <div>Vendor Adjustments: {vendorAdjustments?.length || 0} items (with 20 limit) | Loading: {adjustmentsLoading.toString()}</div>
                <div>Refresh Key: {refreshKey}</div>
                <div>Last Update: {lastUpdate?.toISOString() || 'Never'}</div>
                <div>Summary vendors: {vendorSummaries?.map(v => v.vendedor_nome).join(', ') || 'None'}</div>
                <div>Adjustment vendors: {vendorAdjustments ? [...new Set(vendorAdjustments.map(adj => adj.vendedor_nome))].join(', ') : 'None'}</div>
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
