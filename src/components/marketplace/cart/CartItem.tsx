
import React from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
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

  // Log para debug das imagens no carrinho
  console.log(`[CartItem] Rendering item:`, {
    productId: item.produto?.id,
    productName: item.produto?.nome,
    hasImageUrl: !!item.produto?.imagem_url,
    imageUrl: item.produto?.imagem_url,
    hasImagens: item.produto?.imagens && Array.isArray(item.produto?.imagens) && item.produto?.imagens.length > 0,
    imagensCount: item.produto?.imagens?.length || 0,
    productData: item.produto
  });

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
    <div className={`flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 gap-2 ${isProcessing ? 'opacity-70' : ''}`}>
      {/* Product image usando o componente ProductImage */}
      <div className="w-14 h-14 flex-shrink-0">
        <ProductImage 
          imagemUrl={item.produto?.imagem_url}
          imagens={item.produto?.imagens}
          productName={item.produto?.nome || 'Produto'}
          size="sm"
        />
      </div>

      {/* Product details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.produto?.nome || 'Produto sem nome'}</h4>
        <p className="text-green-700 text-sm font-medium">
          R$ {productPrice.toFixed(2)}
        </p>
        {maxStock > 0 && maxStock < 10 && (
          <p className="text-amber-600 text-xs">
            Apenas {maxStock} em estoque
          </p>
        )}
      </div>

      {/* Quantity controls - compact version */}
      <div className="flex items-center">
        <Button 
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full p-0 border-gray-200"
          onClick={handleDecrease}
          disabled={quantity <= 1 || isProcessing}
        >
          <Minus size={12} />
        </Button>
        
        <span className="w-6 text-center text-sm">{quantity}</span>
        
        <Button 
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full p-0 border-gray-200"
          onClick={handleIncrease}
          disabled={quantity >= maxStock || isProcessing}
        >
          <Plus size={12} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 ml-1"
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
