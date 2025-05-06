
import React from 'react';
import Card from '@/components/common/Card';
import { CartItem as CartItemType } from '@/types/cart';
import CartItem from './CartItem';

interface StoreInfo {
  id: string;
  nome: string;
  logo_url?: string | null;
}

interface StoreCartGroupProps {
  store: StoreInfo;
  items: CartItemType[];
  onUpdateQuantity: (item: CartItemType, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  processingItem: string | null;
}

const StoreCartGroup: React.FC<StoreCartGroupProps> = ({
  store,
  items,
  onUpdateQuantity,
  onRemoveItem,
  processingItem
}) => {
  // Safety check for items and store
  if (!items || items.length === 0 || !store?.id) {
    console.log('[StoreCartGroup] No items or invalid store, not rendering');
    return null;
  }

  // Calculate store subtotal
  const storeSubtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3 ml-2">
        <img 
          src={store.logo_url || 'https://via.placeholder.com/30'} 
          alt={store.nome || 'Loja'} 
          className="w-8 h-8 rounded-full object-cover mr-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/30';
          }}
        />
        <h2 className="font-bold text-xl">{store.nome || `Loja ${store.id.substring(0, 8)}`}</h2>
      </div>
      
      <Card className="divide-y divide-gray-100 shadow-sm">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            processingItem={processingItem}
          />
        ))}
      </Card>
    </div>
  );
};

export default StoreCartGroup;
