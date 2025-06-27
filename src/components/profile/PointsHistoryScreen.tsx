
import React from 'react';
import { usePointsHistory } from './points-history/usePointsHistory';
import PointsHistoryHeader from './points-history/PointsHistoryHeader';
import MonthlyLevelProgress from './points-history/MonthlyLevelProgress';
import PointsSummary from './points-history/PointsSummary';
import TransactionFilters from './points-history/TransactionFilters';
import TransactionList from './points-history/TransactionList';

const PointsHistoryScreen: React.FC = () => {
  const {
    transactions,
    isLoading,
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
    refreshProfile();
    refetch();
  };

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

export default PointsHistoryScreen;
