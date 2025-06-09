
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
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AdminLoyaltyDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['loyalty-stats', refreshKey],
    queryFn: loyaltyService.getLoyaltyStats
  });

  const {
    data: userRanking,
    isLoading: rankingLoading
  } = useQuery({
    queryKey: ['user-ranking', refreshKey],
    queryFn: () => loyaltyService.getUserRanking(10)
  });

  const {
    data: recentTransactions,
    isLoading: transactionsLoading
  } = useQuery({
    queryKey: ['recent-transactions', refreshKey],
    queryFn: () => loyaltyService.getRecentTransactions(20)
  });

  const {
    data: vendorAdjustments,
    isLoading: adjustmentsLoading
  } = useQuery({
    queryKey: ['vendor-adjustments', refreshKey],
    queryFn: () => loyaltyService.getVendorAdjustments(20)
  });

  const {
    data: vendorSummaries,
    isLoading: summariesLoading
  } = useQuery({
    queryKey: ['vendor-adjustments-summary', refreshKey],
    queryFn: loyaltyService.getVendorAdjustmentsSummary
  });

  // Real-time subscription setup
  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    setIsRealtimeConnected(true);

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
      unsubscribe();
      setIsRealtimeConnected(false);
    };
  }, [queryClient]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLastUpdate(new Date());
    toast.success('Dados atualizados');
  };

  useEffect(() => {
    if (statsError) {
      console.error('Error loading loyalty dashboard:', statsError);
      toast.error('Erro ao carregar dashboard de fidelidade');
    }
  }, [statsError]);

  return (
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
          </div>
          <div className="flex items-center gap-4">
            <RealtimeIndicator 
              isConnected={isRealtimeConnected} 
              lastUpdate={lastUpdate} 
            />
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
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
  );
};

export default AdminLoyaltyDashboard;
