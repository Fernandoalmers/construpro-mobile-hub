
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/services/productService';
import { getPromotionInfo } from '@/utils/promotionUtils';
import OfferCountdown from '@/components/common/OfferCountdown';

interface ProductInfoProps {
  produto: Product;
  deliveryEstimate: {
    minDays: number;
    maxDays: number;
  };
}

const ProductInfo: React.FC<ProductInfoProps> = ({ produto, deliveryEstimate }) => {
  // Use promotion utils for consistent promotion handling
  const promotionInfo = getProm"otionInfo(produto);
  
  // Get correct prices
  const regularPrice = produto.preco_normal || produto.preco;
  const currentPrice = promotionInfo.hasActivePromotion ? promotionInfo.promotionalPrice! : promotionInfo.originalPrice;

  // Get product rating and review count
  const productRating = React.useMemo(() => 
    produto.avaliacao || 0
  , [produto.id, produto.avaliacao]);
  
  const reviewCount = React.useMemo(() => 
    produto.num_avaliacoes || 0
  , [produto.id, produto.num_avaliacoes]);

  // Debug log for promotion display
  console.log('[ProductInfo] Promotion display for', produto.nome, {
    hasActivePromotion: promotionInfo.hasActivePromotion,
    promotionalPrice: promotionInfo.promotionalPrice,
    originalPrice: promotionInfo.originalPrice,
    discountPercentage: promotionInfo.discountPercentage,
    promotionEndDate: promotionInfo.promotionEndDate
  });

  return (
    <div>
      <div className="flex items-center space-x-1 mb-2">
        {produto.categoria && (
          <Badge variant="outline" className="capitalize">
            {produto.categoria}
          </Badge>
        )}
        {produto.segmento && (
          <Badge variant="outline" className="bg-blue-50">
            {produto.segmento}
          </Badge>
        )}
        {produto.sku && (
          <span className="text-xs text-gray-500 ml-auto">
            SKU: {produto.sku}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-2">{produto.nome}</h1>
      
      {/* Store info */}
      {produto.stores && (
        <Link 
          to={`/loja/${produto.stores.id}`} 
          className="flex items-center mb-3 text-sm text-blue-600 hover:underline"
        >
          {produto.stores.logo_url && (
            <img 
              src={produto.stores.logo_url} 
              alt={produto.stores.nome_loja || 'Loja'} 
              className="w-5 h-5 rounded-full mr-1 object-cover" 
            />
          )}
          Vendido por {produto.stores.nome_loja || 'Loja'}
        </Link>
      )}
      
      {/* Rating */}
      <div className="flex items-center mb-4">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`${
                star <= productRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-2">
          ({reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'})
        </span>
      </div>
      
      {/* Price section - UPDATED FOR UNIVERSAL PROMOTION DISPLAY */}
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
        
        <div className="text-sm text-gray-700 mt-1">
          {produto.estoque > 0 ? (
            <span className="text-green-700">Em estoque ({produto.estoque} {produto.estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'})</span>
          ) : (
            <span className="text-red-500">Fora de estoque</span>
          )}
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
      
      {/* Shipping info */}
      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mb-4">
        <p className="text-sm text-gray-600 flex items-center mb-2">
          <Clock className="h-4 w-4 mr-2 text-green-600" />
          <span className="font-medium">Prazo de entrega</span>
        </p>
        
        <div className="text-sm text-gray-700 space-y-1 ml-6">
          <div className="flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            <span><strong>Capelinha/MG:</strong> até 24h</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            <span><strong>Cidades vizinhas:</strong> até 7 dias úteis</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
            <span><strong>Demais localidades:</strong> frete a combinar (informado após o fechamento do pedido)</span>
          </div>
        </div>
      </div>
      
      {produto.unidade_medida && produto.unidade_medida !== 'unidade' && (
        <div className="text-xs bg-yellow-50 p-2 rounded-md border border-yellow-100 mb-4">
          <span className="font-bold">Nota: </span>
          <span>Este produto é vendido por {produto.unidade_medida.toLowerCase()}</span>
          {produto.unidade_medida.toLowerCase().includes('m²') && (
            <span className="block mt-1">As quantidades serão ajustadas automaticamente para múltiplos da unidade de venda.</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
