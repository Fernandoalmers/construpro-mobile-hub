
import React from 'react';
import Card from '../common/Card';
import { Star, Package, CircleDollarSign, Heart } from 'lucide-react';

interface Produto {
  id: string;
  lojaId: string;
  nome: string;
  imagemUrl: string;
  preco: number;
  precoAnterior?: number; // Added for promotions
  pontos: number;
  categoria: string;
  avaliacao?: number;
  especificacoes?: string[];
  estoque?: number;
  descricao?: string;
}

interface Loja {
  id: string;
  nome: string;
  logoUrl: string;
  avaliacao: number;
}

interface ProdutoCardProps {
  produto: Produto;
  loja?: Loja;
  onClick?: () => void;
  onLojaClick?: (lojaId: string) => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ 
  produto, 
  loja, 
  onClick,
  onLojaClick
}) => {
  // Handle loja click without triggering product click
  const handleLojaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLojaClick && loja) {
      onLojaClick(loja.id);
    }
  };

  // Format rating display
  const formatRating = () => {
    if (!produto.avaliacao) return null;
    return produto.avaliacao.toFixed(1);
  };
  
  // Calculate discount percentage if there's a previous price
  const getDiscountPercentage = () => {
    if (produto.precoAnterior && produto.precoAnterior > produto.preco) {
      const discount = ((produto.precoAnterior - produto.preco) / produto.precoAnterior) * 100;
      return Math.round(discount);
    }
    return null;
  };
  
  // Get colors/variants count from specifications
  const getColorsCount = () => {
    if (produto.especificacoes && produto.especificacoes.length > 0) {
      // Simplified mock logic - in a real app, this would be based on actual data
      const colorSpec = produto.especificacoes.find(spec => 
        spec.toLowerCase().includes('cor') || 
        spec.toLowerCase().includes('cores')
      );
      
      if (colorSpec) {
        const count = Math.floor(Math.random() * 5) + 1; // Mock data: 1-5 colors
        return `Disponível em ${count} cores`;
      }
    }
    return null;
  };
  
  // Installment calculation (mock)
  const getInstallments = () => {
    const installments = 6; // Mock - in a real app, this would be from the product data
    const installmentValue = (produto.preco / installments).toFixed(2);
    return `em ${installments}x R$ ${installmentValue} sem juros`;
  };
  
  const discountPercentage = getDiscountPercentage();
  const isOnSale = !!discountPercentage;
  const colorsCount = getColorsCount();
  const hasFreeShipping = produto.preco > 100; // Mock logic for free shipping

  return (
    <Card 
      className="border-b border-gray-200 overflow-hidden flex p-0 hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-row w-full">
        <div className="flex-1 p-4">
          {/* Store name */}
          {loja && (
            <div 
              className="text-xs text-gray-500 mb-1 cursor-pointer hover:underline truncate"
              onClick={handleLojaClick}
            >
              {loja.nome} {loja.avaliacao >= 4.5 && <span className="text-blue-600 text-xs font-medium ml-1">★ FULL</span>}
            </div>
          )}
          
          {/* Product name - max 2 lines */}
          <h3 className="font-medium text-sm text-gray-900 mb-1.5 line-clamp-2">
            {produto.nome}
          </h3>
          
          {/* Rating */}
          {produto.avaliacao && (
            <div className="flex items-center space-x-1 mb-1.5">
              <span className="font-medium text-sm">{formatRating()}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={12} 
                    className={`${star <= produto.avaliacao! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">(107)</span>
            </div>
          )}
          
          {/* Pricing section */}
          <div className="flex flex-col mb-1">
            {isOnSale && (
              <p className="text-xs text-gray-500 line-through">
                R$ {produto.precoAnterior?.toFixed(2)}
              </p>
            )}
            
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">
                R$ {produto.preco.toFixed(2)}
                <sup className="text-xs font-normal">
                  {produto.preco.toString().split('.')[1] ? produto.preco.toString().split('.')[1].padEnd(2, '0') : '00'}
                </sup>
              </p>
              
              {isOnSale && (
                <span className="text-green-600 text-sm font-medium">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-800">{getInstallments()}</p>
          </div>
          
          {/* Shipping and additional info */}
          <div className="mt-1 flex flex-col gap-1">
            {hasFreeShipping && (
              <span className="text-green-600 text-sm">Frete grátis</span>
            )}
            
            {colorsCount && (
              <span className="text-xs text-gray-600">{colorsCount}</span>
            )}
            
            <div className="flex items-center text-xs bg-construPro-orange/10 text-construPro-orange rounded-full px-2 py-0.5 w-fit">
              <CircleDollarSign size={12} className="mr-0.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{produto.pontos} pts</span>
            </div>
          </div>
        </div>
        
        {/* Product image */}
        <div className="relative w-32 min-w-[8rem] h-32">
          <img 
            src={produto.imagemUrl} 
            alt={produto.nome} 
            className="w-full h-full object-contain"
          />
          
          {/* Favorite button */}
          <button 
            className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Heart size={18} className="text-gray-400 hover:text-construPro-orange" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ProdutoCard;
