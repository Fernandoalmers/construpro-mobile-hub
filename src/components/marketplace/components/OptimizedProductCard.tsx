
import React, { memo } from 'react';
import { Star, MapPin } from 'lucide-react';
import LazyImage from '@/components/common/LazyImage';

interface OptimizedProductCardProps {
  product: {
    id: string;
    nome: string;
    preco_normal: number;
    preco_promocional?: number;
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
  const handleClick = () => onClick(product.id);
  
  const storeName = product.stores?.nome_loja || product.vendedores?.nome_loja || 'Loja não informada';
  const imageUrl = product.imagens?.[0] || '/img/placeholder.png';
  const hasDiscount = product.preco_promocional && product.preco_promocional < product.preco_normal;
  const discountPercent = hasDiscount 
    ? Math.round(((product.preco_normal - product.preco_promocional!) / product.preco_normal) * 100)
    : 0;

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <LazyImage
          src={imageUrl}
          alt={product.nome}
          className="w-full h-48 object-cover rounded-t-lg"
          placeholderClassName="w-full h-48 rounded-t-lg"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{discountPercent}%
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
          {product.nome}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600">{product.avaliacao}</span>
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{storeName}</span>
        </div>
        
        <div className="space-y-1">
          {hasDiscount && (
            <div className="text-xs text-gray-500 line-through">
              R$ {product.preco_normal.toFixed(2)}
            </div>
          )}
          <div className="text-sm font-semibold text-construPro-blue">
            R$ {(product.preco_promocional || product.preco_normal).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;
