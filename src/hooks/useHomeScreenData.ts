
import { useMemo } from 'react';
import { usePointsHistory } from '@/components/profile/points-history/usePointsHistory';
import { calculateMonthlyPoints, calculateLevelInfo, getCurrentMonthName } from '@/utils/pointsCalculations';

export const useHomeScreenData = () => {
  const {
    transactions,
    isLoading,
    totalPoints,
    totalEarned,
    totalRedeemed,
    refreshProfile
  } = usePointsHistory();

  const homeData = useMemo(() => {
    // Calcular pontos mensais usando a lógica correta
    const monthlyPoints = calculateMonthlyPoints(transactions);
    
    // Calcular informações do nível usando pontos mensais
    const levelInfo = calculateLevelInfo(monthlyPoints);
    
    // Obter nome do mês atual
    const currentMonth = getCurrentMonthName();
    
    // Determinar cor e dados do nível para a interface
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
      // Dados reais do usuário
      userPoints: totalPoints,
      monthlyPoints,
      totalEarned,
      totalRedeemed,
      
      // Informações do nível baseadas em pontos mensais
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
  }, [transactions, totalPoints, totalEarned, totalRedeemed, isLoading, refreshProfile]);

  return homeData;
};
