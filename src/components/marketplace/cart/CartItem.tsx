
import React from 'react';
import { Trash2, Minus, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem as CartItemType } from '@/types/cart';
import ProductImage from '../../admin/products/components/ProductImage';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (item: CartItemType, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  processingItem: string | null;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemoveItem, processingItem }) => {
  if (!item) return null;

  const maxStock = item.produto?.estoque || 0;
  const productPrice = item.preco || 0;
  const quantity = item.quantidade || 1;
  const isProcessing = processingItem === item.id;
  const subtotal = productPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1 && !isProcessing) {
      onUpdateQuantity(item, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock && !isProcessing) {
      onUpdateQuantity(item, quantity + 1);
    }
  };

  const handleRemove = () => {
    if (!isProcessing) {
      onRemoveItem(item.id);
    }
  };

  return (
    <div className={`flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 gap-3 transition-all duration-200 ${isProcessing ? 'opacity-70 pointer-events-none' : 'hover:shadow-md'}`}>
      {/* Product image - menor */}
      <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
        <ProductImage 
          imagemUrl={item.produto?.imagem_url}
          imagens={item.produto?.imagens}
          productName={item.produto?.nome || 'Produto'}
          size="sm"
        />
      </div>

      {/* Product details - mais compacto */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-800 truncate mb-1">
          {item.produto?.nome || 'Produto sem nome'}
        </h4>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-blue-600 text-sm font-bold">
            R$ {productPrice.toFixed(2)}
          </span>
          {quantity > 1 && (
            <span className="text-xs text-gray-500">
              × {quantity} = R$ {subtotal.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Stock warning - menor */}
        {maxStock > 0 && maxStock < 10 && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <Package className="w-3 h-3" />
            <span>Apenas {maxStock} em estoque</span>
          </div>
        )}
      </div>

      {/* Quantity controls - mais compacto */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-l-lg hover:bg-gray-200"
            onClick={handleDecrease}
            disabled={quantity <= 1 || isProcessing}
          >
            <Minus size={12} />
          </Button>
          
          <span className="w-7 text-center text-sm font-medium bg-white border-x border-gray-300 py-1">
            {quantity}
          </span>
          
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-r-lg hover:bg-gray-200"
            onClick={handleIncrease}
            disabled={quantity >= maxStock || isProcessing}
          >
            <Plus size={12} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          onClick={handleRemove}
          disabled={isProcessing}
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
