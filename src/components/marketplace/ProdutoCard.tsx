
import React from 'react';
import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartActions } from '@/hooks/use-cart-actions';

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
  hideRating?: boolean;
  hideActions?: boolean;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ 
  produto, 
  loja,
  onClick,
  onLojaClick,
  onAddToCart,
  onBuyNow,
  isFavorite = false,
  isAddingToCart = false,
  showActions = false,
  hideRating = false,
  hideActions = true
}) => {
  const { handleAddToCart, handleBuyNow, isAddingToCart: cartLoading, isBuyingNow } = useCartActions();
  
  // Utilizar os dados reais do produto de forma consistente
  const precoRegular = produto.preco_normal || produto.precoNormal || produto.preco || 0;
  const precoPromocional = produto.preco_promocional || produto.precoPromocional || null;
  
  // Garantir que o preço promocional só seja considerado se for menor que o preço regular
  const hasDiscount = precoPromocional && precoPromocional < precoRegular;
  const precoExibir = hasDiscount ? precoPromocional : precoRegular;
  
  // Garantir a consistência das avaliações através da memoização dos valores
  // para que não mudem durante a renderização ou rolagem
  const avaliacao = React.useMemo(() => {
    return typeof produto.avaliacao === 'number' ? produto.avaliacao : 0;
  }, [produto.id, produto.avaliacao]);
  
  const avaliacoesCount = React.useMemo(() => {
    return produto.avaliacoes_count || produto.num_avaliacoes || 0;
  }, [produto.id, produto.avaliacoes_count, produto.num_avaliacoes]);
  
  // Free shipping threshold (products above R$ 100 qualify for free shipping)
  const hasFreeShipping = precoExibir >= 100;
  
  // Handle cart actions with logging
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[ProdutoCard] Add to cart clicked for product:', produto.id);
    
    if (produto && produto.id) {
      handleAddToCart(produto.id, 1);
    } else if (onAddToCart) {
      onAddToCart(e);
    }
  };
  
  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[ProdutoCard] Buy now clicked for product:', produto.id);
    
    if (produto && produto.id) {
      handleBuyNow(produto.id, 1);
    } else if (onBuyNow) {
      onBuyNow(e);
    }
  };
  
  // Função para renderizar as estrelas baseadas nas avaliações reais
  const renderStars = () => {
    // Garantir que avaliacao seja um número entre 0 e 5
    const rating = Math.max(0, Math.min(5, Number(avaliacao) || 0));
    
    return (
      <div className="flex items-center mb-1">
        <div className="flex text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} className={star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}>
              ★
            </span>
          ))}
        </div>
        <span className="text-xs ml-1">
          ({avaliacoesCount})
        </span>
      </div>
    );
  };
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col relative"
    >
      {/* Product Image - positioned on the top */}
      <div className="relative w-full h-40 overflow-hidden bg-gray-50">
        <img 
          src={produto.imagemUrl || produto.imagem_url || (produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : '')} 
          alt={produto.nome}
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        {/* Product name */}
        <h3 className="text-sm text-gray-700 line-clamp-2 mb-1">{produto.nome}</h3>
        
        {/* Rating - Usando dados reais de avaliações */}
        {!hideRating && renderStars()}
        
        {/* Price section - Mostrando preço promocional quando disponível */}
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
              console.log('[ProdutoCard] Store clicked:', loja.id);
              onLojaClick && onLojaClick(loja.id);
            }}
          >
            Vendido por {loja.nome}
          </div>
        )}
        
        {/* Custom action buttons */}
        {!hideActions && showActions && (
          <div className="mt-2 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
            <button 
              onClick={handleAddToCartClick}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
              disabled={cartLoading[produto.id] || !produto.id}
            >
              {cartLoading[produto.id] ? 'Adicionando...' : 'Adicionar ao Carrinho'}
            </button>
            
            <button 
              onClick={handleBuyNowClick}
              className="text-xs bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded"
              disabled={isBuyingNow[produto.id] || !produto.id}
            >
              {isBuyingNow[produto.id] ? 'Processando...' : 'Comprar Agora'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProdutoCard;
