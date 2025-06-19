
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
  
  // Verificar se a promoção está ativa e não expirou
  const isPromotionExpired = promotionEndDate ? new Date(promotionEndDate) <= now : false;
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
