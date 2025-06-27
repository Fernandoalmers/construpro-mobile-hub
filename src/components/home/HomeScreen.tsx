
import React, { useEffect, useState } from 'react';
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
import TempCepInput from '@/components/marketplace/components/TempCepInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const HomeScreen: React.FC = () => {
  const { products, isLoading: produtosLoading } = useMarketplaceData(null);
  const { rewards, isLoading: rewardsLoading } = useRewardsData();
  const [showCepModal, setShowCepModal] = useState(false);
  
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

  const handleChangeCep = () => {
    setShowCepModal(true);
  };

  const handleCepSubmit = (cep: string) => {
    console.log('CEP atualizado:', cep);
    setShowCepModal(false);
    // Aqui você pode adicionar lógica para recarregar os produtos com o novo CEP
  };

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
          onChangeCep={handleChangeCep}
        />
      </div>

      {/* CEP Modal */}
      <Dialog open={showCepModal} onOpenChange={setShowCepModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar CEP</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <TempCepInput onCepSubmit={handleCepSubmit} />
          </div>
        </DialogContent>
      </Dialog>

      <BottomTabNavigator />
    </div>
  );
};

export default HomeScreen;
