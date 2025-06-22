
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Clock } from 'lucide-react';
import { getPromotionInfo } from '@/utils/promotionUtils';
import OfferCountdown from '@/components/common/OfferCountdown';
import { truncateTextForLines } from '@/utils/textUtils';

interface ListProductViewProps {
  products: any[];
  navigateToProduct: (productId: string) => void;
  onLojaClick?: (lojaId: string) => void;
  showActions?: boolean;
}

const ListProductView: React.FC<ListProductViewProps> = ({ 
  products, 
  navigateToProduct,
  onLojaClick,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {products.map(produto => {
        // Debug log to check product data
        console.log('[ListProductView] Product data:', {
          id: produto.id,
          nome: produto.nome,
          stores: produto.stores,
          vendedor_nome: produto.vendedor_nome,
          vendedores: produto.vendedores
        });

        // Get promotion info
        const promotionInfo = getPromotionInfo(produto);

        // Get proper image URL with fallbacks
        const imageUrl = produto.imagemPrincipal || 
                         (produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : null) ||
                         produto.imagemUrl || 
                         produto.imagem_url || 
                         'https://via.placeholder.com/150?text=Sem+Imagem';

        // Standardized store name logic
        const storeName = produto.stores?.nome_loja || 
                         produto.vendedores?.nome_loja ||
                         produto.stores?.nome || 
                         produto.vendedores?.nome ||
                         produto.vendedor_nome;

        // Get store ID for click handling
        const storeId = produto.stores?.id || 
                       produto.vendedores?.id ||
                       produto.vendedor_id;

        // Only show store info if we have a valid store name
        const shouldShowStoreInfo = storeName && storeName.trim().length > 0;

        // Truncate product name and store name intelligently
        const truncatedName = truncateTextForLines(produto.nome, 40, 2);
        const truncatedStoreName = truncateTextForLines(storeName || '', 30, 2);

        console.log('[ListProductView] Store info processed:', {
          productName: produto.nome,
          storeName,
          storeId,
          shouldShowStoreInfo,
          storeData: produto.stores || produto.vendedores
        });

        return (
          <div 
            key={produto.id} 
            className="bg-white rounded-lg shadow-sm p-3 flex border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => navigateToProduct(produto.id)}
          >
            {/* Product Image - Clean, no overlays */}
            <div className="w-24 h-24 rounded-lg overflow-hidden mr-3 flex-shrink-0 bg-gray-50">
              <img 
                src={imageUrl} 
                alt={produto.nome}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  console.error('Error loading product image:', imageUrl);
                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Sem+Imagem';
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Linha 1: Product name - up to 2 lines, reduced size */}
              <h3 className="text-xs font-semibold text-gray-900 mb-1 leading-tight min-h-[2rem] break-words">
                {truncatedName}
              </h3>
              
              {/* Linha 2: Category + Timer (when promotion is active) */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 font-normal">
                  {produto.categoria || "Categoria não especificada"}
                </span>
                {promotionInfo.hasActivePromotion && promotionInfo.promotionEndDate && (
                  <>
                    <span className="text-gray-300 text-xs">•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-red-500" />
                      <OfferCountdown 
                        endDate={promotionInfo.promotionEndDate}
                        isActive={promotionInfo.hasActivePromotion}
                        size="sm"
                        variant="compact"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Linha 3: Price reorganized - Promotional -> Original -> Discount */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-base text-construPro-blue">
                  R$ {(promotionInfo.hasActivePromotion ? promotionInfo.promotionalPrice! : promotionInfo.originalPrice).toFixed(2).replace('.', ',')}
                </span>
                {promotionInfo.hasActivePromotion && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      R$ {promotionInfo.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold">
                      -{promotionInfo.discountPercentage}%
                    </div>
                  </>
                )}
              </div>

              {/* Linha 4: Store name - up to 2 lines */}
              {shouldShowStoreInfo && (
                <div className="flex items-start gap-1">
                  <Store size={10} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div 
                    className="text-xs text-gray-600 hover:text-construPro-blue hover:underline cursor-pointer font-normal leading-tight transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (storeId && onLojaClick) {
                        onLojaClick(storeId);
                      }
                    }}
                  >
                    Vendido por {truncatedStoreName}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListProductView;
