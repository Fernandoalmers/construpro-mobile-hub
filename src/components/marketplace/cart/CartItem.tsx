
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/cart';
import { cn } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (item: CartItemType, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  processingItem: string | null;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  processingItem
}) => {
  // Safety check for item
  if (!item) {
    console.error('[CartItem] Item is undefined or null');
    return null;
  }
  
  // Safety check for product data
  if (!item.produto) {
    console.error('[CartItem] Item missing produto property:', item);
    return (
      <div className="p-4 flex gap-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-500">Item inválido (ID: {item?.id || 'desconhecido'})</p>
      </div>
    );
  }

  // Extract image URL safely
  let imageUrl = 'https://via.placeholder.com/80';
  if (item.produto?.imagem_url) {
    imageUrl = item.produto.imagem_url;
  } else if (item.produto?.imagens && Array.isArray(item.produto.imagens) && item.produto.imagens.length > 0) {
    // Try to get image from imagens array if imagem_url is not available
    imageUrl = String(item.produto.imagens[0]);
  }

  // Get price and quantity
  const price = item.preco || 0;
  const quantity = item.quantidade || 0;
  const subtotal = price * quantity;
  const isDisabled = processingItem === item.id;
  const maxStock = item.produto?.estoque || 0;

  return (
    <div className="p-4 flex gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
        <img 
          src={imageUrl} 
          alt={item.produto?.nome || 'Produto'} 
          className={cn(
            "w-full h-full object-cover",
            typeof imageUrl !== 'string' && "hidden" // Hide if not a string
          )}
          onError={(e) => {
            console.warn(`Failed to load image for product: ${item.produto_id}`);
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
          }}
        />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium text-lg">{item.produto?.nome || 'Produto sem nome'}</h3>
        <div className="flex justify-between mt-2">
          <div>
            <p className="text-construPro-blue font-bold text-lg">
              R$ {subtotal.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              {quantity} x R$ {price.toFixed(2)}
            </p>
            {item.produto?.pontos > 0 && (
              <div className="bg-orange-100 text-orange-500 text-sm rounded-full px-3 py-0.5 inline-block mt-1">
                {item.produto.pontos * quantity} pontos
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <button 
              onClick={() => onRemoveItem(item.id)} 
              className="text-red-500 mb-2 p-1 hover:bg-red-50 rounded-full transition-colors"
              disabled={isDisabled}
              aria-label="Remover item"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => onUpdateQuantity(item, quantity - 1)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center",
                  quantity <= 1 ? "text-gray-300" : "text-gray-600 hover:bg-gray-100"
                )}
                disabled={isDisabled || quantity <= 1}
                aria-label="Diminuir quantidade"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-lg">
                {isDisabled ? "..." : quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item, quantity + 1)}
                className={cn(
                  "w-10 h-10 flex items-center justify-center",
                  quantity >= maxStock ? "text-gray-300" : "text-gray-600 hover:bg-gray-100"
                )}
                disabled={isDisabled || quantity >= maxStock}
                aria-label="Aumentar quantidade"
              >
                <Plus size={16} />
              </button>
            </div>
            {maxStock > 0 && quantity < maxStock && (
              <span className="text-xs text-gray-500 mt-1">
                Disponível: {maxStock}
              </span>
            )}
            {quantity >= maxStock && (
              <span className="text-xs text-yellow-500 mt-1">
                Estoque máximo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
