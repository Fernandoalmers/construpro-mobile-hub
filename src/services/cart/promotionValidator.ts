

import { CartItem } from '@/types/cart';
import { getPromotionInfo } from '@/utils/promotionUtils';

export interface PromotionValidationResult {
  validItems: CartItem[];
  expiredItems: CartItem[];
  hasExpiredItems: boolean;
  message?: string;
}

/**
 * Validate cart items for expired promotions
 */
export const validateCartPromotions = (cartItems: CartItem[]): PromotionValidationResult => {
  const validItems: CartItem[] = [];
  const expiredItems: CartItem[] = [];

  cartItems.forEach(item => {
    if (!item.produto) {
      validItems.push(item);
      return;
    }

    const promotionInfo = getPromotionInfo(item.produto);
    
    // If promotion is expired, add to expired items
    if (promotionInfo.isPromotionExpired && item.produto.promocao_ativa) {
      expiredItems.push(item);
    } else {
      validItems.push(item);
    }
  });

  const hasExpiredItems = expiredItems.length > 0;
  let message = '';

  if (hasExpiredItems) {
    if (expiredItems.length === 1) {
      message = `A promoção do produto "${expiredItems[0].produto?.nome}" expirou e foi removido do carrinho.`;
    } else {
      message = `${expiredItems.length} produtos com promoções expiradas foram removidos do carrinho.`;
    }
  }

  return {
    validItems,
    expiredItems,
    hasExpiredItems,
    message
  };
};

/**
 * Check if a specific product has an expired promotion
 */
export const hasExpiredPromotion = (product: any): boolean => {
  if (!product || !product.promocao_ativa) return false;
  
  const promotionInfo = getPromotionInfo(product);
  return promotionInfo.isPromotionExpired;
};

/**
 * Get products with promotions ending soon (within next hour)
 */
export const getPromotionsEndingSoon = (cartItems: CartItem[]): CartItem[] => {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));

  return cartItems.filter(item => {
    if (!item.produto?.promocao_ativa || !item.produto?.promocao_fim) return false;
    
    const promotionEnd = new Date(item.produto.promocao_fim);
    return promotionEnd <= oneHourFromNow && promotionEnd > now;
  });
};
