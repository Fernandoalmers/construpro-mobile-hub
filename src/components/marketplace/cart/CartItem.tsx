
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
  return (
    <div className="p-4 flex gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
        <img 
          src={item.produto?.imagem_url || 'https://via.placeholder.com/80'} 
          alt={item.produto?.nome} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
          }}
        />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium">{item.produto?.nome}</h3>
        <div className="flex justify-between mt-2">
          <div>
            <p className="text-construPro-blue font-bold">
              R$ {item.subtotal.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {item.quantidade} x R$ {item.preco.toFixed(2)}
            </p>
            <div className="bg-construPro-orange/10 text-construPro-orange text-xs rounded-full px-2 py-0.5 inline-block mt-1">
              {item.produto?.pontos || 0} pontos
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <button 
              onClick={() => onRemoveItem(item.id)} 
              className="text-red-500 mb-2"
              disabled={processingItem === item.id}
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => onUpdateQuantity(item, item.quantidade - 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600"
                disabled={processingItem === item.id || item.quantidade <= 1}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center">
                {processingItem === item.id ? "..." : item.quantidade}
              </span>
              <button
                onClick={() => onUpdateQuantity(item, item.quantidade + 1)}
                className="w-8 h-8 flex items-center justify-center text-gray-600"
                disabled={processingItem === item.id || item.quantidade >= (item.produto?.estoque || 0)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
