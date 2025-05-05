
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductActions from '@/components/product/ProductActions';

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
  showActions = false
}) => {
  return (
    <div className="flex flex-col gap-2">
      {products.map(produto => (
        <div 
          key={produto.id} 
          className="bg-white rounded-md shadow-sm p-3 flex border border-gray-100 relative"
          onClick={() => navigateToProduct(produto.id)}
        >
          {/* Product Image - positioned on the left side */}
          <div className="w-20 h-20 rounded-md overflow-hidden mr-3 flex-shrink-0">
            <img 
              src={produto.imagemUrl || produto.imagem_url} 
              alt={produto.nome}
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex-1">
            {/* Product name */}
            <h3 className="text-sm font-medium line-clamp-2 mb-1">{produto.nome}</h3>
            
            {/* Type/Category */}
            <div className="text-xs text-gray-500 mb-1">
              {produto.categoria || "Acrílica"}
            </div>
            
            {/* Rating */}
            <div className="flex items-center mb-1">
              <div className="flex text-amber-400">
                {"★".repeat(Math.round(produto.avaliacao || 4.5))}
              </div>
              <span className="text-xs ml-1">
                ({produto.avaliacoes_count || Math.floor(Math.random() * 100) + 50})
              </span>
            </div>
            
            {/* Price section */}
            <div className="font-bold text-lg">
              R$ {((produto.preco_promocional || produto.preco_normal) || 99.90).toFixed(2).replace('.', ',')}
            </div>

            {/* Store name */}
            {produto.stores && (
              <div 
                className="text-xs text-gray-500 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onLojaClick && onLojaClick(produto.stores.id);
                }}
              >
                Vendido por {produto.stores.nome}
              </div>
            )}
            
            {/* Free shipping */}
            <div className="text-xs text-green-600 mt-1">
              Entrega GRÁTIS
            </div>
            
            {/* Product Actions - Re-enable actions */}
            {showActions && produto?.id && (
              <div 
                className="mt-2" 
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '200px' }}
              >
                <ProductActions productId={produto.id} quantity={1} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListProductView;
