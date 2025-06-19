
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/productService';
import { getPromotionInfo } from '@/utils/promotionUtils';
import OfferCountdown from '@/components/common/OfferCountdown';

interface ProductPricingProps {
  produto: Product;
}

const ProductPricing: React.FC<ProductPricingProps> = ({ produto }) => {
  // Use promotion utils for consistent promotion handling
  const promotionInfo = getPromotionInfo(produto);
  
  // Get correct prices
  const currentPrice = promotionInfo.hasActivePromotion ? promotionInfo.promotionalPrice! : promotionInfo.originalPrice;

  // Debug log for promotion display
  console.log('[ProductPricing] Promotion display for', produto.nome, {
    hasActivePromotion: promotionInfo.hasActivePromotion,
    promotionalPrice: promotionInfo.promotionalPrice,
    originalPrice: promotionInfo.originalPrice,
    discountPercentage: promotionInfo.discountPercentage,
    promotionEndDate: promotionInfo.promotionEndDate
  });

  return (
    <div className="mb-4">
      {/* Promotion badges and countdown */}
      {promotionInfo.hasActivePromotion && (
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-red-500 hover:bg-red-600 text-xs">
            {promotionInfo.discountPercentage}% OFF
          </Badge>
          <OfferCountdown 
            endDate={promotionInfo.promotionEndDate}
            isActive={promotionInfo.hasActivePromotion}
            size="sm"
            variant="compact"
          />
        </div>
      )}
      
      {/* Price display */}
      <div className="flex items-baseline mb-2">
        {promotionInfo.hasActivePromotion && (
          <span className="text-gray-500 line-through mr-2">
            R$ {promotionInfo.originalPrice.toFixed(2)}
          </span>
        )}
        <span className="text-2xl font-bold text-green-700">
          R$ {currentPrice.toFixed(2)}
        </span>
      </div>
      
      {/* Points information */}
      <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
        <div className="text-sm">
          <span className="font-medium">Ganhe </span>
          <span className="text-blue-700 font-bold">
            {produto.pontos_consumidor || produto.pontos || 0} pontos
          </span>
          <span> na compra deste produto</span>
        </div>
        {(produto.pontos_profissional || 0) > 0 && (
          <div className="text-xs mt-1">
            <span className="font-medium">Profissionais ganham </span>
            <span className="text-blue-700 font-bold">
              {produto.pontos_profissional} pontos
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPricing;
