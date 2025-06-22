
import React, { memo } from 'react';
import { Star, MapPin } from 'lucide-react';
import LazyImage from '@/components/common/LazyImage';
import { getPromotionInfo } from '@/utils/promotionUtils';
import OfferCountdown from '@/components/common/OfferCountdown';

interface OptimizedProductCardProps {
  product: {
    id: string;
    nome: string;
    preco_normal: number;
    preco_promocional?: number;
    promocao_ativa?: boolean;
    promocao_fim?: string;
    imagens?: string[];
    avaliacao: number;
    categoria: string;
    stores?: {
      nome_loja: string;
    };
    vendedores?: {
      nome_loja: string;
    };
  };
  onClick: (productId: string) => void;
}

const OptimizedProductCard = memo<OptimizedProductCardProps>(({ product, onClick }) => {
  if (!product || !product.id) {
    console.warn('[OptimizedProductCard] Invalid product data:', product);
    return null;
  }

  const handleClick = () => {
    if (product.id) {
      onClick(product.id);
    }
  };
  
  const storeName = product.stores?.nome_loja || product.vendedores?.nome_loja || 'Loja não informada';
  const imageUrl = (Array.isArray(product.imagens) && product.imagens.length > 0) 
    ? product.imagens[0] 
    : '/img/placeholder.png';
  
  // Use improved promotion validation
  const promotionInfo = getPromotionInfo(product);
  const avaliacao = product.avaliacao || 0;
  const nome = product.nome || 'Produto sem nome';
  const categoria = product.categoria || '';

  // Debug promotion info for the specific product
  if (nome.includes('TRINCHA ATLAS')) {
    console.log(`[OptimizedProductCard] Promotion info for ${nome}:`, {
      promotionInfo,
      product_promocao_ativa: product.promocao_ativa,
      product_promocao_fim: product.promocao_fim,
      product_preco_promocional: product.preco_promocional
    });
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <LazyImage
          src={imageUrl}
          alt={nome}
          className="w-full h-48 object-cover rounded-t-lg"
          placeholderClassName="w-full h-48 rounded-t-lg"
        />
        {promotionInfo.hasActivePromotion && (
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <div className="bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-semibold">
              -{promotionInfo.discountPercentage}%
            </div>
            <OfferCountdown 
              endDate={promotionInfo.promotionEndDate}
              isActive={promotionInfo.hasActivePromotion}
              size="sm"
              variant="compact"
            />
          </div>
        )}
      </div>
      
      <div className="p-2 sm:p-3">
        <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2 mb-1 leading-tight min-h-[2.5rem] sm:min-h-[2.8rem]">
          {nome}
        </h3>
        
        <div className="flex items-center gap-1 mb-1 sm:mb-2">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600">{avaliacao.toFixed(1)}</span>
        </div>
        
        <div className="flex items-center gap-1 mb-1 sm:mb-2">
          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 truncate">{storeName}</span>
        </div>
        
        <div className="space-y-0.5 sm:space-y-1">
          {promotionInfo.hasActivePromotion && (
            <div className="text-xs text-gray-500 line-through">
              R$ {promotionInfo.originalPrice.toFixed(2)}
            </div>
          )}
          <div className="text-sm font-semibold text-construPro-blue">
            R$ {(promotionInfo.hasActivePromotion ? promotionInfo.promotionalPrice! : promotionInfo.originalPrice).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;
