
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';

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

        // Determine prices logic
        const precoRegular = produto.preco_normal || produto.precoNormal || produto.preco || 0;
        const precoPromocional = produto.preco_promocional || produto.precoPromocional || null;
        const hasDiscount = precoPromocional && precoPromocional < precoRegular;
        const precoExibir = hasDiscount ? precoPromocional : precoRegular;

        // Get proper image URL with fallbacks
        const imageUrl = produto.imagemPrincipal || 
                         (produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : null) ||
                         produto.imagemUrl || 
                         produto.imagem_url || 
                         'https://via.placeholder.com/150?text=Sem+Imagem';

        // FIXED: Standardized store name logic - always use real store name
        const storeName = produto.stores?.nome_loja || 
                         produto.vendedores?.nome_loja ||
                         produto.stores?.nome || 
                         produto.vendedores?.nome ||
                         produto.vendedor_nome;

        // Get store ID for click handling
        const storeId = produto.stores?.id || 
                       produto.vendedores?.id ||
                       produto.vendedor_id;

        // FIXED: Only show store info if we have a valid store name (not generic fallback)
        const shouldShowStoreInfo = storeName && storeName.trim().length > 0;

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
            className="bg-white rounded-md shadow-sm p-3 flex border border-gray-100 relative cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateToProduct(produto.id)}
          >
            {/* Product Image - positioned on the left side */}
            <div className="w-20 h-20 rounded-md overflow-hidden mr-3 flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={produto.nome}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Error loading product image:', imageUrl);
                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Sem+Imagem';
                }}
              />
            </div>
            
            <div className="flex-1">
              {/* Product name */}
              <h3 className="text-sm font-medium line-clamp-2 mb-1">{produto.nome}</h3>
              
              {/* Type/Category */}
              <div className="text-xs text-gray-500 mb-2">
                {produto.categoria || "Categoria não especificada"}
              </div>
              
              {/* Price section with conditional promotional display */}
              <div className="font-bold text-lg mb-2">
                R$ {precoExibir.toFixed(2).replace('.', ',')}
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through ml-2">
                    R$ {precoRegular.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {/* Store name with icon - STANDARDIZED - Always show when available */}
              {shouldShowStoreInfo && (
                <div className="flex items-center gap-1 mb-2">
                  <Store size={12} className="text-gray-500 flex-shrink-0" />
                  <div 
                    className="text-xs text-gray-600 hover:underline cursor-pointer font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (storeId && onLojaClick) {
                        onLojaClick(storeId);
                      }
                    }}
                  >
                    Vendido por {storeName}
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
