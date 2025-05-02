
import React from 'react';
import Card from '../common/Card';
import { Star, Package, Tag, CircleDollarSign } from 'lucide-react';

interface Produto {
  id: string;
  lojaId: string;
  nome: string;
  imagemUrl: string;
  preco: number;
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

  // Get unit type from specifications (if available)
  const getUnitInfo = () => {
    if (produto.especificacoes && produto.especificacoes.length > 0) {
      // Look for volume information in specifications
      const volumeSpec = produto.especificacoes.find(spec => 
        spec.toLowerCase().includes('volume') || 
        spec.toLowerCase().includes('litro') ||
        spec.toLowerCase().includes('m²') ||
        spec.toLowerCase().includes('kg')
      );
      
      if (volumeSpec) {
        return volumeSpec.split(':')[1] || volumeSpec;
      }
    }
    
    // Default case: return the category as fallback
    return produto.categoria;
  };
  
  // Format rating display
  const formatRating = () => {
    if (!produto.avaliacao) return null;
    return produto.avaliacao.toFixed(1);
  };
  
  // Check if product is on sale (simplified mock logic)
  const isOnSale = produto.id === '3' || produto.id === '7'; // Mock data for demo
  
  // Check if product is best seller (simplified mock logic)
  const isBestSeller = produto.id === '1' || produto.id === '9'; // Mock data for demo

  return (
    <Card className="overflow-hidden flex flex-col h-full" onClick={onClick}>
      {/* Product image with badges */}
      <div className="relative aspect-square bg-gray-100">
        <img 
          src={produto.imagemUrl} 
          alt={produto.nome} 
          className="w-full h-full object-cover"
        />
        
        {/* Badges (best seller, promo) */}
        <div className="absolute top-0 left-0 p-1.5 flex flex-col gap-1">
          {isBestSeller && (
            <span className="bg-construPro-blue text-white text-xs px-2 py-1 rounded-sm font-medium">
              Mais Vendido
            </span>
          )}
          
          {isOnSale && (
            <span className="bg-construPro-orange text-white text-xs px-2 py-1 rounded-sm font-medium">
              Promoção
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        {/* Store name */}
        {loja && (
          <div 
            className="text-xs text-gray-500 mb-1 cursor-pointer hover:underline"
            onClick={handleLojaClick}
          >
            {loja.nome}
          </div>
        )}
        
        {/* Product name - max 2 lines */}
        <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
          {produto.nome}
        </h3>
        
        {/* Rating */}
        {produto.avaliacao && (
          <div className="flex items-center space-x-1 mb-1">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium">{formatRating()}</span>
            <span className="text-xs text-gray-500">(107)</span>
          </div>
        )}
        
        {/* Volume/Unit info */}
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Package size={12} className="mr-1" />
          <span>{getUnitInfo()}</span>
        </div>
        
        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-base font-bold text-construPro-blue">
              R$ {produto.preco.toFixed(2)}
            </p>
            
            {/* Points */}
            <div className="flex items-center text-xs bg-construPro-orange/10 text-construPro-orange rounded-full px-2 py-0.5">
              <CircleDollarSign size={12} className="mr-0.5" />
              <span>{produto.pontos} pts</span>
            </div>
          </div>
          
          {/* Remove duplicate category tag since we already show it in the unit info */}
        </div>
      </div>
    </Card>
  );
};

export default ProdutoCard;
