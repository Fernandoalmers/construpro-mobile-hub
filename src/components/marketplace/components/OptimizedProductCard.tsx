
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
  // Safety checks for product data
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
  
  const precoNormal = product.preco_normal || 0;
  const precoPromocional = product.preco_promocional;
  const hasDiscount = precoPromocional && precoPromocional < precoNormal;
  const discountPercent = hasDiscount 
    ? Math.round(((precoNormal - precoPromocional) / precoNormal) * 100)
    : 0;

  const avaliacao = product.avaliacao || 0;
  const nome = product.nome || 'Produto sem nome';
  const categoria = product.categoria || '';

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
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
            -{discountPercent}%
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
          {nome}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600">{avaliacao.toFixed(1)}</span>
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{storeName}</span>
        </div>
        
        <div className="space-y-1">
          {hasDiscount && (
            <div className="text-xs text-gray-500 line-through">
              R$ {precoNormal.toFixed(2)}
            </div>
          )}
          <div className="text-sm font-semibold text-construPro-blue">
            R$ {(precoPromocional || precoNormal).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedProductCard.displayName = 'OptimizedProductCard';

export default OptimizedProductCard;
