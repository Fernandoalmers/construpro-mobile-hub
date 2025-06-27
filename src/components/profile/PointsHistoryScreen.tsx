
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePointsHistory } from './points-history/usePointsHistory';
import PointsHistoryHeader from './points-history/PointsHistoryHeader';
import MonthlyLevelProgress from './points-history/MonthlyLevelProgress';
import PointsSummary from './points-history/PointsSummary';
import TransactionFilters from './points-history/TransactionFilters';
import TransactionList from './points-history/TransactionList';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingState from '@/components/common/LoadingState';

const PointsHistoryScreenContent: React.FC = () => {
  const {
    transactions,
    isLoading,
    error,
    refetch,
    levelInfo,
    currentMonth,
    totalPoints,
    totalEarned,
    totalRedeemed,
    filters,
    refreshProfile
  } = usePointsHistory();
  
  const handleRefresh = () => {
    console.log('🔄 [PointsHistoryScreen] Manual refresh triggered');
    refreshProfile();
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <div className="p-6 pt-12">
          <LoadingState text="Carregando histórico de pontos..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <PointsHistoryHeader />
        <div className="p-6 -mt-6">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erro ao carregar histórico
                </h3>
                <p className="text-gray-600 mb-4">
                  Não foi possível carregar o histórico de pontos. Tente novamente.
                </p>
                <Button onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <PointsHistoryHeader />
      
      {/* Monthly Level Progress */}
      <div className="px-6 -mt-6 mb-4">
        <MonthlyLevelProgress 
          currentMonth={currentMonth} 
          levelInfo={levelInfo} 
        />
      </div>
      
      {/* Points Summary */}
      <div className="px-6">
        <PointsSummary
          totalPoints={totalPoints}
          totalEarned={totalEarned}
          totalRedeemed={totalRedeemed}
          onRefresh={handleRefresh}
        />
      </div>
      
      {/* Filters and Transactions */}
      <div className="p-6">
        <TransactionFilters
          showFilters={filters.showFilters}
          setShowFilters={filters.setShowFilters}
          typeFilter={filters.typeFilter}
          setTypeFilter={filters.setTypeFilter}
          originFilter={filters.originFilter}
          setOriginFilter={filters.setOriginFilter}
          periodFilter={filters.periodFilter}
          setPeriodFilter={filters.setPeriodFilter}
        />
        
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

const PointsHistoryScreen: React.FC = () => {
  return (
    <ErrorBoundary>
      <PointsHistoryScreenContent />
    </ErrorBoundary>
  );
};

export default PointsHistoryScreen;
