
import React from 'react';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProductActions from '@/components/product/ProductActions';

interface ProdutoCardProps {
  produto: any;
  loja?: any;
  onClick: () => void;
  onLojaClick?: (lojaId: string) => void;
  onAddToFavorites?: (e: React.MouseEvent, produtoId: string) => void;
  onAddToCart?: (e: React.MouseEvent) => void;
  onBuyNow?: (e: React.MouseEvent) => void;
  isFavorite?: boolean;
  isAddingToCart?: boolean;
  showActions?: boolean;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ 
  produto, 
  loja,
  onClick,
  onLojaClick,
  isFavorite = false,
  showActions = false
}) => {
  // Calculate discount percentage if applicable
  const precoRegular = produto.preco_normal || produto.precoNormal || produto.preco || 0;
  const precoPromocional = produto.preco_promocional || produto.precoPromocional || null;
  
  // Only use promotional price if it exists and is less than regular price
  const precoExibir = (precoPromocional && precoPromocional < precoRegular) ? precoPromocional : precoRegular;
  const hasDiscount = precoPromocional && precoPromocional < precoRegular;
  
  // Free shipping threshold (products above R$ 100 qualify for free shipping)
  const hasFreeShipping = precoExibir >= 100;
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col relative"
    >
      {/* Product Image - positioned on the top */}
      <div className="relative w-full h-40 overflow-hidden bg-gray-50">
        <img 
          src={produto.imagemUrl || produto.imagem_url} 
          alt={produto.nome}
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        {/* Product name */}
        <h3 className="text-sm text-gray-700 line-clamp-2 mb-1">{produto.nome}</h3>
        
        {/* Rating - Using actual data from database */}
        <div className="flex items-center mb-1">
          <div className="flex text-amber-400">
            {"★".repeat(Math.round(produto.avaliacao || 0))}
            {"☆".repeat(5 - Math.round(produto.avaliacao || 0))}
          </div>
          <span className="text-xs ml-1">
            ({produto.avaliacoes_count || 0})
          </span>
        </div>
        
        {/* Price section */}
        <div className="mb-1">
          <span className="text-lg font-bold">R$ {precoExibir.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through ml-2">
              R$ {precoRegular.toFixed(2)}
            </span>
          )}
        </div>

        {/* Free shipping badge */}
        {hasFreeShipping && (
          <span className="text-green-600 text-xs font-medium mb-1.5 flex items-center">
            <Truck size={12} className="mr-1" /> Entrega GRÁTIS
          </span>
        )}
        
        {/* Store name */}
        {loja && (
          <div 
            className="text-xs text-gray-500 hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onLojaClick && onLojaClick(loja.id);
            }}
          >
            Vendido por {loja.nome}
          </div>
        )}
        
        {/* Product Actions */}
        {showActions && produto?.id && (
          <div className="mt-2" onClick={e => e.stopPropagation()}>
            <ProductActions productId={produto.id} quantity={1} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProdutoCard;
