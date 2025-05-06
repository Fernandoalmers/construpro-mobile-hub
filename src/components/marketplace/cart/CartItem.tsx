
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/cart';

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
  }

  // Get price and quantity
  const price = item.preco || 0;
  const quantity = item.quantidade || 0;
  const subtotal = price * quantity;
  const isDisabled = processingItem === item.id;
  const maxStock = item.produto?.estoque || 0;

  return (
    <div className="p-4 flex gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
        <img 
          src={imageUrl} 
          alt={item.produto?.nome || 'Produto'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
          }}
        />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium">{item.produto?.nome || 'Produto sem nome'}</h3>
        <div className="flex justify-between mt-2">
          <div>
            <p className="text-construPro-blue font-bold">
              R$ {subtotal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {quantity} x R$ {price.toFixed(2)}
            </p>
            {item.produto?.pontos > 0 && (
              <div className="bg-construPro-orange/10 text-construPro-orange text-xs rounded-full px-2 py-0.5 inline-block mt-1">
                {item.produto.pontos} pontos
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <button 
              onClick={() => onRemoveItem(item.id)} 
              className="text-red-500 mb-2"
              disabled={isDisabled}
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => onUpdateQuantity(item, quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600"
                disabled={isDisabled || quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center">
                {isDisabled ? "..." : quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item, quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600"
                disabled={isDisabled || quantity >= maxStock}
              >
                <Plus size={14} />
              </button>
            </div>
            {maxStock > 0 && (
              <span className="text-xs text-gray-500 mt-1">
                Disponível: {maxStock}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
