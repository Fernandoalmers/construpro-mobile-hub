
import React from 'react';
import { Star } from 'lucide-react';

interface ProdutoCardProps {
  produto: any;
  loja?: any;
  onClick: () => void;
  onLojaClick?: (lojaId: string) => void;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ 
  produto, 
  loja,
  onClick,
  onLojaClick
}) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-md shadow-sm p-3 flex border border-gray-100"
    >
      {/* Product Image - moved to left side */}
      <div className="w-24 h-24 rounded-md overflow-hidden mr-3 flex-shrink-0">
        <img 
          src={produto.imagemUrl} 
          alt={produto.nome}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1">
        {/* Store name */}
        {loja && (
          <div 
            className="text-xs text-gray-500 mb-1 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onLojaClick && onLojaClick(loja.id);
            }}
          >
            {loja.nome}
          </div>
        )}
        
        {/* Product name */}
        <h3 className="text-sm font-medium line-clamp-2">{produto.nome}</h3>
        
        {/* Rating */}
        <div className="flex items-center mt-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs ml-1">{produto.avaliacao}</span>
        </div>
        
        {/* Price */}
        <div className="mt-1">
          <span className="text-sm font-bold">R$ {produto.preco.toFixed(2)}</span>
          {'precoAnterior' in produto && produto.precoAnterior > produto.preco && (
            <span className="text-xs text-gray-400 line-through ml-2">
              R$ {(produto as any).precoAnterior.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutoCard;
