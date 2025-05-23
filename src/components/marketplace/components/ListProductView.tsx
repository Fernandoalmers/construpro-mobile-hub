
import React from 'react';
import { useNavigate } from 'react-router-dom';

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

        return (
          <div 
            key={produto.id} 
            className="bg-white rounded-md shadow-sm p-3 flex border border-gray-100 relative"
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
              <div className="text-xs text-gray-500 mb-1">
                {produto.categoria || "Categoria não especificada"}
              </div>
              
              {/* Price section with conditional promotional display */}
              <div className="font-bold text-lg">
                R$ {precoExibir.toFixed(2).replace('.', ',')}
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through ml-2">
                    R$ {precoRegular.toFixed(2).replace('.', ',')}
                  </span>
                )}
              </div>

              {/* Store name */}
              {(produto.stores || produto.vendedor_nome) && (
                <div 
                  className="text-xs text-gray-500 hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (produto.stores && onLojaClick) {
                      onLojaClick(produto.stores.id);
                    } else if (produto.vendedor_id && onLojaClick) {
                      onLojaClick(produto.vendedor_id);
                    }
                  }}
                >
                  Vendido por {produto.stores?.nome || produto.vendedor_nome || 'Loja'}
                </div>
              )}
              
              {/* Free shipping */}
              <div className="text-xs text-green-600 mt-1">
                Entrega GRÁTIS
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListProductView;
