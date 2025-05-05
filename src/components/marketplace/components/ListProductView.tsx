
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import ProdutoCard from '../ProdutoCard';

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
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 pb-4">
      {products.map((product, index) => {
        // Memoize product rating and review count to ensure they don't change during scrolling
        const productRating = React.useMemo(() => 
          product.avaliacao || 0
        , [product.id, product.avaliacao]);
        
        const reviewCount = React.useMemo(() => 
          product.avaliacoes_count || product.num_avaliacoes || 0
        , [product.id, product.avaliacoes_count, product.num_avaliacoes]);
        
        // Calculate discount percentage
        const hasDiscount = (product.preco_anterior || 0) > (product.preco || 0);
        const discountPercentage = hasDiscount 
          ? Math.round(((product.preco_anterior - product.preco) / product.preco_anterior) * 100)
          : 0;
          
        return (
          <div 
            key={`${product.id}-${index}`}
            className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            onClick={() => navigateToProduct(product.id)}
          >
            <div className="flex">
              <div className="w-28 h-28 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden">
                <img 
                  src={product.imagemUrl || product.imagem_url || (product.imagens && product.imagens.length > 0 ? product.imagens[0] : '')} 
                  alt={product.nome}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="ml-4 flex-1">
                <h3 className="text-gray-700 line-clamp-2">{product.nome}</h3>
                
                <div className="flex items-center mb-1">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={star <= productRating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs ml-1">
                    ({reviewCount})
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-lg font-bold">R$ {product.preco?.toFixed(2) || '0.00'}</span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through ml-2">
                      R$ {product.preco_anterior?.toFixed(2)}
                    </span>
                  )}
                  {hasDiscount && discountPercentage > 0 && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-1 rounded">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </div>
                
                {product.lojas || product.stores || product.vendedores ? (
                  <div 
                    className="text-xs text-gray-500 hover:underline cursor-pointer mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      const lojaId = product.lojas?.id || product.stores?.id || product.vendedor_id;
                      onLojaClick && lojaId && onLojaClick(lojaId);
                    }}
                  >
                    Vendido por {product.lojas?.nome || product.stores?.nome_loja || product.vendedores?.nome_loja || 'Loja'}
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* Product Actions */}
            {showActions && product?.id && (
              <div className="mt-3 flex justify-end" onClick={e => e.stopPropagation()}>
                <ProdutoCard
                  produto={product}
                  onClick={() => {}}
                  showActions={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ListProductView;
