
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

// Level thresholds for monthly points - Updated with new ranges
export const MONTHLY_LEVEL_THRESHOLDS = {
  bronze: { min: 0, max: 1999 },
  silver: { min: 2000, max: 4999 },
  gold: { min: 5000, max: 5000 }, // Gold is the highest level
};

export const LEVEL_MAP = {
  bronze: { color: '#CD7F32', name: 'Bronze' },
  silver: { color: '#C0C0C0', name: 'Prata' },
  gold: { color: '#FFD700', name: 'Ouro' },
};

// Month names in Portuguese
const MONTH_NAMES_PT = {
  'January': 'Janeiro',
  'February': 'Fevereiro',
  'March': 'Março',
  'April': 'Abril',
  'May': 'Maio',
  'June': 'Junho',
  'July': 'Julho',
  'August': 'Agosto',
  'September': 'Setembro',
  'October': 'Outubro',
  'November': 'Novembro',
  'December': 'Dezembro'
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
 * Get the current month name in Portuguese for display
 */
export function getCurrentMonthName(): string {
  const englishMonth = format(new Date(), 'MMMM');
  return MONTH_NAMES_PT[englishMonth as keyof typeof MONTH_NAMES_PT] || englishMonth;
}

/**
 * Calculate level information based on monthly points
 */
export function calculateLevelInfo(monthlyPoints: number): LevelInfo {
  let currentLevel = 'bronze';
  let nextLevel = 'silver';
  let currentProgress = monthlyPoints;
  let maxProgress = MONTHLY_LEVEL_THRESHOLDS.silver.min;
  
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
