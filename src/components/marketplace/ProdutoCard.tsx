
import React from 'react';
import { Star, Heart, Truck, Percent, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProdutoCardProps {
  produto: any;
  loja?: any;
  onClick: () => void;
  onLojaClick?: (lojaId: string) => void;
  onAddToFavorites?: (e: React.MouseEvent, produtoId: string) => void;
  onAddToCart?: (e: React.MouseEvent) => void;
  isFavorite?: boolean;
  isAddingToCart?: boolean;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ 
  produto, 
  loja,
  onClick,
  onLojaClick,
  onAddToFavorites,
  onAddToCart,
  isFavorite = false,
  isAddingToCart = false
}) => {
  // Calculate discount percentage if applicable
  const hasDiscount = produto.precoAnterior > produto.preco || produto.preco_anterior > produto.preco;
  const precoAnterior = produto.precoAnterior || produto.preco_anterior || 0;
  const precoAtual = produto.preco || 0;
  
  let discountPercentage = 0;
  if (hasDiscount && precoAnterior > 0) {
    discountPercentage = Math.round(((precoAnterior - precoAtual) / precoAnterior) * 100);
  }
  
  // Free shipping threshold (products above R$ 100 qualify for free shipping)
  const hasFreeShipping = precoAtual >= 100;
  
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
        
        {/* Discount badge if applicable */}
        {hasDiscount && discountPercentage > 0 && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            <Percent size={12} className="mr-1" /> {discountPercentage}% OFF
          </Badge>
        )}
        
        {/* Favorite button (right corner) */}
        {onAddToFavorites && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToFavorites(e, produto.id);
            }}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm hover:bg-gray-100"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart 
              size={18} 
              className={cn(
                "transition-colors", 
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
              )} 
            />
          </button>
        )}
        
        {/* Add to Cart button */}
        {onAddToCart && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(e);
            }}
            disabled={isAddingToCart}
            className="absolute bottom-2 right-2 rounded-full bg-green-500 hover:bg-green-600 text-white border-0 shadow-md"
          >
            {isAddingToCart ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Plus size={16} />
            )}
          </Button>
        )}
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        {/* Price section */}
        <div className="mb-1">
          <span className="text-lg font-bold">R$ {(precoAtual).toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through ml-2">
              R$ {(precoAnterior).toFixed(2)}
            </span>
          )}
        </div>

        {/* Free shipping badge */}
        {hasFreeShipping && (
          <span className="text-green-600 text-xs font-medium mb-1.5 flex items-center">
            <Truck size={12} className="mr-1" /> Frete grátis
          </span>
        )}
        
        {/* Product name */}
        <h3 className="text-sm text-gray-700 line-clamp-2 mb-1.5">{produto.nome}</h3>
        
        {/* Store name */}
        {loja && (
          <div 
            className="text-xs text-gray-500 mb-1 hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onLojaClick && onLojaClick(loja.id);
            }}
          >
            Vendido por {loja.nome}
          </div>
        )}
        
        {/* Rating */}
        <div className="flex items-center mt-auto">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs ml-1">{produto.avaliacao || 0}</span>
        </div>
        
        {/* Points */}
        {(produto.pontos > 0 || produto.pontos_consumidor > 0) && (
          <div className="text-xs text-construPro-orange mt-1">
            Ganhe {produto.pontos || produto.pontos_consumidor} pontos
          </div>
        )}
      </div>
    </div>
  );
};

export default ProdutoCard;
