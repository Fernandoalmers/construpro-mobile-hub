
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

/**
 * Get correct points for a product based on user type
 */
export function getProductPoints(product: any, userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'): number {
  if (!product) {
    console.log('[getProductPoints] No product provided');
    return 0;
  }
  
  console.log('[getProductPoints] Calculating points for product:', {
    productId: product.id,
    productName: product.nome,
    userType,
    pontos_profissional: product.pontos_profissional,
    pontos_consumidor: product.pontos_consumidor,
    pontos: product.pontos
  });
  
  // For professional users, use pontos_profissional if available, otherwise fall back to pontos_consumidor
  if (userType === 'profissional') {
    const professionalPoints = product.pontos_profissional || product.pontos_consumidor || 0;
    console.log('[getProductPoints] Professional user gets:', professionalPoints, 'points');
    return professionalPoints;
  }
  
  // For consumers and other types, use pontos_consumidor (the base points)
  const consumerPoints = product.pontos_consumidor || product.pontos || 0;
  console.log('[getProductPoints] Consumer/other user gets:', consumerPoints, 'points');
  return consumerPoints;
}

/**
 * Calculate total points for cart items based on user type
 */
export function calculateCartPoints(cartItems: any[], userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'): number {
  console.log('[calculateCartPoints] Calculating points for', cartItems.length, 'items, user type:', userType);
  
  return cartItems.reduce((total, item) => {
    const product = item.produto || item;
    const pointsPerUnit = getProductPoints(product, userType);
    const itemTotal = pointsPerUnit * (item.quantidade || 1);
    
    console.log('[calculateCartPoints] Item:', {
      productName: product.nome,
      pointsPerUnit,
      quantity: item.quantidade || 1,
      itemTotal
    });
    
    return total + itemTotal;
  }, 0);
}
