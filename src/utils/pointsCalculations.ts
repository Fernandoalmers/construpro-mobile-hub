
/**
 * Utility functions for calculating points and levels
 */

import { format } from 'date-fns';

export interface Transaction {
  id: string;
  tipo: string;
  pontos: number;
  data: string;
  descricao: string;
  referencia_id?: string;
}

export interface LevelInfo {
  currentLevel: string;
  nextLevel: string;
  currentProgress: number;
  maxProgress: number;
  levelName: string;
  levelColor: string;
  pointsToNextLevel: number;
}

// Level thresholds for monthly points
export const MONTHLY_LEVEL_THRESHOLDS = {
  bronze: { min: 0, max: 500 },
  silver: { min: 500, max: 1000 },
  gold: { min: 1000, max: 1000 }, // Gold is the highest level
};

export const LEVEL_MAP = {
  bronze: { color: '#CD7F32', name: 'Bronze' },
  silver: { color: '#C0C0C0', name: 'Prata' },
  gold: { color: '#FFD700', name: 'Ouro' },
};

/**
 * Calculate points earned in the current month from transactions
 */
export function calculateMonthlyPoints(transactions: Transaction[]): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return transactions
    .filter(t => {
      const transactionDate = new Date(t.data);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        t.pontos > 0 // Only count positive points (earned)
      );
    })
    .reduce((sum, t) => sum + t.pontos, 0);
}

/**
 * Get the current month name for display
 */
export function getCurrentMonthName(): string {
  return format(new Date(), 'MMMM');
}

/**
 * Calculate level information based on monthly points
 */
export function calculateLevelInfo(monthlyPoints: number): LevelInfo {
  let currentLevel = 'bronze';
  let nextLevel = 'silver';
  let currentProgress = 0;
  let maxProgress = 500;
  
  if (monthlyPoints >= MONTHLY_LEVEL_THRESHOLDS.gold.min) {
    currentLevel = 'gold';
    nextLevel = '';
    currentProgress = MONTHLY_LEVEL_THRESHOLDS.gold.min;
    maxProgress = MONTHLY_LEVEL_THRESHOLDS.gold.min;
  } else if (monthlyPoints >= MONTHLY_LEVEL_THRESHOLDS.silver.min) {
    currentLevel = 'silver';
    nextLevel = 'gold';
    currentProgress = monthlyPoints - MONTHLY_LEVEL_THRESHOLDS.silver.min;
    maxProgress = MONTHLY_LEVEL_THRESHOLDS.gold.min - MONTHLY_LEVEL_THRESHOLDS.silver.min;
  } else {
    currentProgress = monthlyPoints;
    maxProgress = MONTHLY_LEVEL_THRESHOLDS.silver.min;
  }
  
  const levelName = LEVEL_MAP[currentLevel as keyof typeof LEVEL_MAP].name;
  const levelColor = LEVEL_MAP[currentLevel as keyof typeof LEVEL_MAP].color;
  const pointsToNextLevel = maxProgress - currentProgress;
  
  return {
    currentLevel,
    nextLevel,
    currentProgress,
    maxProgress,
    levelName,
    levelColor,
    pointsToNextLevel
  };
}
