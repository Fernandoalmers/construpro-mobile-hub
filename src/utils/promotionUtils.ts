
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
  
  // CORRIGIDO: Melhor validação de promoção ativa
  const isPromotionExpired = promotionEndDate ? 
    new Date(promotionEndDate).getTime() < now.getTime() : false;
  
  const hasValidPromotionalPrice = promotionalPrice && promotionalPrice > 0 && promotionalPrice < originalPrice;
  
  // CORRIGIDO: Verificar explicitamente o campo promocao_ativa e se não expirou
  const hasActivePromotion = Boolean(promotionActive) && hasValidPromotionalPrice && !isPromotionExpired;
  
  const discountPercentage = hasActivePromotion && promotionalPrice
    ? Math.round(((originalPrice - promotionalPrice) / originalPrice) * 100)
    : 0;

  // Debug log para o produto específico
  if (product.nome?.includes('TRINCHA ATLAS')) {
    console.log('[getPromotionInfo] TRINCHA ATLAS analysis:', {
      nome: product.nome,
      promocao_ativa: promotionActive,
      preco_normal: originalPrice,
      preco_promocional: promotionalPrice,
      promocao_fim: promotionEndDate,
      isPromotionExpired,
      hasValidPromotionalPrice,
      hasActivePromotion,
      discountPercentage
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
 * CORRIGIDO: Valida se uma promoção deve ser considerada ativa
 */
export const validatePromotionStatus = (
  isActive: boolean,
  startDate?: string | null,
  endDate?: string | null,
  promotionalPrice?: number | null,
  normalPrice?: number
): boolean => {
  // Se não está marcada como ativa, não é ativa
  if (!isActive) return false;
  
  // Deve ter preço promocional válido
  if (!promotionalPrice || !normalPrice) return false;
  if (promotionalPrice >= normalPrice) return false;
  
  const now = new Date();
  
  // Verificar data de início se fornecida
  if (startDate) {
    const start = new Date(startDate);
    if (start.getTime() > now.getTime()) {
      return false; // Promoção ainda não começou
    }
  }
  
  // Verificar data de fim se fornecida
  if (endDate) {
    const end = new Date(endDate);
    if (end.getTime() < now.getTime()) {
      return false; // Promoção já terminou
    }
  }
  
  return true;
};
