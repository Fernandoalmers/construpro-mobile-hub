
import React, { useEffect } from 'react';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import { useRewardsData } from '@/hooks/useRewardsData';
import BottomTabNavigator from '@/components/layout/BottomTabNavigator';
import { useHomeScreenData } from '@/hooks/useHomeScreenData';
import HomeHeader from './components/HomeHeader';
import WelcomeSection from './components/WelcomeSection';
import PointsBalanceCard from './components/PointsBalanceCard';
import QuickAccessSection from './components/QuickAccessSection';
import PromotionsSection from './components/PromotionsSection';
import FeaturedProductsSection from './components/FeaturedProductsSection';

const HomeScreen: React.FC = () => {
  const { products, isLoading: produtosLoading } = useMarketplaceData(null);
  const { rewards, isLoading: rewardsLoading } = useRewardsData();
  
  // Use real data from Supabase - same logic as points page
  const {
    userPoints,
    monthlyPoints,
    currentLevel,
    levelProgress,
    pointsToNextLevel,
    nextLevelName,
    currentMonth,
    isLoading: pointsLoading,
    hasTransactions,
    refreshData
  } = useHomeScreenData();

  // Debug: Log values for comparison with points page
  useEffect(() => {
    if (!pointsLoading) {
      console.log('🏠 [HomeScreen] Dados atualizados:', {
        userPoints,
        monthlyPoints,
        currentLevel: currentLevel.name,
        levelProgress,
        pointsToNextLevel,
        nextLevelName,
        currentMonth
      });
    }
  }, [userPoints, monthlyPoints, currentLevel, levelProgress, pointsToNextLevel, nextLevelName, currentMonth, pointsLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeHeader />

      {/* Content - Added pb-20 to prevent bottom navigation overlap */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-20">
        <WelcomeSection />

        <PointsBalanceCard
          userPoints={userPoints}
          currentLevel={currentLevel}
          levelProgress={levelProgress}
          pointsToNextLevel={pointsToNextLevel}
          nextLevelName={nextLevelName}
          monthlyPoints={monthlyPoints}
          currentMonth={currentMonth}
          hasTransactions={hasTransactions}
          isLoading={pointsLoading}
        />

        <QuickAccessSection />

        <PromotionsSection />

        <FeaturedProductsSection
          products={products}
          isLoading={produtosLoading}
        />
      </div>

      <BottomTabNavigator />
    </div>
  );
};

export default HomeScreen;
