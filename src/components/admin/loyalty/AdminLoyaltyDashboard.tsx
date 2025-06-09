
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
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AdminLoyaltyDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const queryClient = useQueryClient();

  console.log('🎯 [Dashboard] Rendering with refreshKey:', refreshKey);

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
      console.log('🔍 [Dashboard] Fetching vendor adjustments WITHOUT limit...');
      return loyaltyService.getVendorAdjustments(); // Remove the limit completely
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
    queryKey: ['vendor-adjustments-summary', refreshKey],
    queryFn: () => {
      console.log('🔍 [Dashboard] Executing vendor adjustments summary query...');
      return loyaltyService.getVendorAdjustmentsSummary();
    },
    staleTime: 0, // Force fresh data every time
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    meta: {
      onError: (error: any) => {
        console.error('❌ [Dashboard] Error fetching vendor adjustments summary:', error);
      }
    }
  });

  console.log('🎯 [Dashboard] Vendor summaries state:', {
    count: vendorSummaries?.length || 0,
    loading: summariesLoading,
    error: summariesError?.message || null,
    vendors: vendorSummaries?.map(v => `${v.vendedor_nome} (${v.total_ajustes})`) || []
  });

  console.log('🎯 [Dashboard] Vendor adjustments state:', {
    count: vendorAdjustments?.length || 0,
    loading: adjustmentsLoading,
    error: adjustmentsError?.message || null,
    adjustments: vendorAdjustments?.length || 0
  });

  console.log('🔍 [Dashboard] Detailed vendor summaries data:', vendorSummaries);
  console.log('🔍 [Dashboard] Detailed vendor adjustments data:', vendorAdjustments?.slice(0, 5) || []); // Show first 5 for comparison

  // Compare data between both queries
  console.log('📊 [Dashboard] DATA COMPARISON:');
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

  const handleRefresh = async () => {
    console.log('🔄 [Dashboard] Manual refresh triggered - FORCING cache clear');
    setIsManualRefreshing(true);
    
    try {
      // Clear ALL loyalty-related caches completely
      await queryClient.removeQueries({ queryKey: ['loyalty-stats'] });
      await queryClient.removeQueries({ queryKey: ['user-ranking'] });
      await queryClient.removeQueries({ queryKey: ['recent-transactions'] });
      await queryClient.removeQueries({ queryKey: ['vendor-adjustments'] });
      await queryClient.removeQueries({ queryKey: ['vendor-adjustments-summary'] });
      
      // Force immediate refresh with new key
      setRefreshKey(prev => prev + 1);
      setLastUpdate(new Date());
      
      console.log('🔄 [Dashboard] Cache cleared, forcing fresh data fetch...');
      toast.success('Dados atualizados - cache limpo');
    } catch (error) {
      console.error('Error during manual refresh:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsManualRefreshing(false);
    }
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
              {/* Debug info for admin */}
              <div className="text-xs text-gray-500 mt-2 font-mono">
                Debug: {vendorSummaries?.length || 0} vendedores | {vendorAdjustments?.length || 0} ajustes | Refresh: {refreshKey}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeIndicator 
                isConnected={isRealtimeConnected} 
                lastUpdate={lastUpdate} 
              />
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
