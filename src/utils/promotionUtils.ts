
export interface PromotionInfo {
  hasActivePromotion: boolean;
  isPromotionExpired: boolean;
  originalPrice: number;
  promotionalPrice: number | null;
  promotionEndDate: string | null;
  discountPercentage: number;
}

export const getPromotionInfo = (product: any): PromotionInfo => {
  const now = new Date();
  const originalPrice = product.preco_normal || product.preco || 0;
  const promotionalPrice = product.preco_promocional;
  const promotionEndDate = product.promocao_fim;
  const promotionActive = product.promocao_ativa;
  
  // Improved promotion validation with margin for timing issues
  const isPromotionExpired = promotionEndDate ? 
    new Date(promotionEndDate).getTime() < (now.getTime() - 60000) : false; // 1 minute margin
  
  const hasValidPromotionalPrice = promotionalPrice && promotionalPrice < originalPrice;
  const hasActivePromotion = promotionActive && hasValidPromotionalPrice && !isPromotionExpired;
  
  const discountPercentage = hasActivePromotion 
    ? Math.round(((originalPrice - promotionalPrice) / originalPrice) * 100)
    : 0;

  return {
    hasActivePromotion,
    isPromotionExpired,
    originalPrice,
    promotionalPrice: hasActivePromotion ? promotionalPrice : null,
    promotionEndDate: hasActivePromotion ? promotionEndDate : null,
    discountPercentage
  };
};

export const getFinalPrice = (product: any): number => {
  const promotionInfo = getPromotionInfo(product);
  return promotionInfo.hasActivePromotion 
    ? promotionInfo.promotionalPrice! 
    : promotionInfo.originalPrice;
};

export const shouldShowPromotion = (product: any): boolean => {
  return getPromotionInfo(product).hasActivePromotion;
};

/**
 * Validates if a promotion should be considered active
 * Takes into account timing margins and validation rules
 */
export const validatePromotionStatus = (
  isActive: boolean,
  startDate?: string | null,
  endDate?: string | null,
  promotionalPrice?: number | null,
  normalPrice?: number
): boolean => {
  // If not marked as active, it's not active
  if (!isActive) return false;
  
  // Must have valid promotional price
  if (!promotionalPrice || !normalPrice) return false;
  if (promotionalPrice >= normalPrice) return false;
  
  const now = new Date();
  const marginTime = 60000; // 1 minute margin
  
  // Check start date if provided
  if (startDate) {
    const start = new Date(startDate);
    if (start.getTime() > (now.getTime() + marginTime)) {
      return false; // Promotion hasn't started yet
    }
  }
  
  // Check end date if provided
  if (endDate) {
    const end = new Date(endDate);
    if (end.getTime() < (now.getTime() - marginTime)) {
      return false; // Promotion has ended (with margin)
    }
  }
  
  return true;
};
