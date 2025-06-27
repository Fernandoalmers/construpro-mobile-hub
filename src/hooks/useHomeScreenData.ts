
import { useMemo } from 'react';
import { usePointsHistory } from '@/components/profile/points-history/usePointsHistory';

export const useHomeScreenData = () => {
  const {
    transactions,
    isLoading,
    totalPoints,
    totalEarned,
    totalRedeemed,
    levelInfo,
    currentMonth,
    refreshProfile
  } = usePointsHistory();

  const homeData = useMemo(() => {
    // Calcular pontos mensais usando exatamente a mesma lógica do usePointsHistory
    const currentDate = new Date();
    const currentMonthNumber = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyPoints = transactions
      .filter(t => {
        const transactionDate = new Date(t.data);
        return (
          transactionDate.getMonth() === currentMonthNumber &&
          transactionDate.getFullYear() === currentYear &&
          t.pontos > 0 // Only count positive points (earned)
        );
      })
      .reduce((sum, t) => sum + t.pontos, 0);
    
    // Determinar cor e dados do nível para a interface usando exatamente os mesmos dados
    const getLevelDisplayData = () => {
      const levelColors = {
        bronze: 'bg-orange-600',
        silver: 'bg-gray-400', 
        gold: 'bg-yellow-500'
      };
      
      const levelNames = {
        bronze: 'Bronze',
        silver: 'Prata',
        gold: 'Ouro'
      };
      
      return {
        name: levelNames[levelInfo.currentLevel as keyof typeof levelNames] || 'Bronze',
        color: levelColors[levelInfo.currentLevel as keyof typeof levelColors] || 'bg-orange-600',
        progress: levelInfo.maxProgress > 0 ? (levelInfo.currentProgress / levelInfo.maxProgress) * 100 : 0,
        pointsToNext: levelInfo.pointsToNextLevel,
        nextLevel: levelInfo.nextLevel ? levelNames[levelInfo.nextLevel as keyof typeof levelNames] : null
      };
    };

    const levelDisplay = getLevelDisplayData();

    return {
      // Dados reais do usuário - usando exatamente os mesmos valores do usePointsHistory
      userPoints: totalPoints,
      monthlyPoints,
      totalEarned,
      totalRedeemed,
      
      // Informações do nível - usando exatamente os mesmos cálculos
      currentLevel: levelDisplay,
      levelProgress: levelDisplay.progress,
      pointsToNextLevel: levelDisplay.pointsToNext,
      nextLevelName: levelDisplay.nextLevel,
      currentMonth,
      
      // Estados
      isLoading,
      hasTransactions: transactions.length > 0,
      
      // Funções
      refreshData: refreshProfile
    };
  }, [
    transactions, 
    totalPoints, 
    totalEarned, 
    totalRedeemed, 
    levelInfo,
    currentMonth,
    isLoading, 
    refreshProfile
  ]);

  return homeData;
};
