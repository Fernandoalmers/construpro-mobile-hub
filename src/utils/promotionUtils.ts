
import { getBrazilNow } from '@/utils/brazilTimezone';

export interface PromotionInfo {
  hasActivePromotion: boolean;
  isPromotionExpired: boolean;
  originalPrice: number;
  promotionalPrice: number | null;
  promotionEndDate: string | null;
  discountPercentage: number;
}

export const getPromotionInfo = (product: any): PromotionInfo => {
  const now = getBrazilNow(); // Use Brazil timezone
  const originalPrice = product.preco_normal || product.preco || 0;
  const promotionalPrice = product.preco_promocional;
  const promotionEndDate = product.promocao_fim;
  const promotionStartDate = product.promocao_inicio;
  const promotionActive = product.promocao_ativa;
  
  // Check if promotion is expired using Brazil timezone
  const isPromotionExpired = promotionEndDate ? 
    new Date(promotionEndDate).getTime() < now.getTime() : false;
  
  // Check if promotion has started using Brazil timezone
  const hasPromotionStarted = !promotionStartDate || 
    new Date(promotionStartDate).getTime() <= now.getTime();
  
  const hasValidPromotionalPrice = promotionalPrice && promotionalPrice > 0 && promotionalPrice < originalPrice;
  
  // Check if promotion is explicitly active, not expired, and has started
  const hasActivePromotion = Boolean(promotionActive) && hasValidPromotionalPrice && !isPromotionExpired && hasPromotionStarted;
  
  const discountPercentage = hasActivePromotion && promotionalPrice
    ? Math.round(((originalPrice - promotionalPrice) / originalPrice) * 100)
    : 0;

  // Debug log for ALL products with promotion data
  if (hasActivePromotion || promotionActive) {
    console.log('[getPromotionInfo] Promotion analysis:', {
      nome: product.nome,
      promocao_ativa: promotionActive,
      preco_normal: originalPrice,
      preco_promocional: promotionalPrice,
      promocao_inicio: promotionStartDate,
      promocao_fim: promotionEndDate,
      hasPromotionStarted,
      isPromotionExpired,
      hasValidPromotionalPrice,
      hasActivePromotion,
      discountPercentage,
      brazilNow: now.toISOString()
    });
  }

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
 * Validate if a promotion should be considered active using Brazil timezone
 */
export const validatePromotionStatus = (
  isActive: boolean,
  startDate?: string | null,
  endDate?: string | null,
  promotionalPrice?: number | null,
  normalPrice?: number
): boolean => {
  // If not marked as active, not active
  if (!isActive) return false;
  
  // Must have valid promotional price
  if (!promotionalPrice || !normalPrice) return false;
  if (promotionalPrice >= normalPrice) return false;
  
  const now = getBrazilNow();
  
  // Check start date if provided
  if (startDate) {
    const start = new Date(startDate);
    if (start.getTime() > now.getTime()) {
      return false; // Promotion hasn't started yet
    }
  }
  
  // Check end date if provided
  if (endDate) {
    const end = new Date(endDate);
    if (end.getTime() < now.getTime()) {
      return false; // Promotion has ended
    }
  }
  
  return true;
};
