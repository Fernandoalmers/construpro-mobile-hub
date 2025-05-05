
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
  // Debug the store and items data
  console.log('[StoreCartGroup] Rendering store:', store?.id, store?.nome);
  console.log('[StoreCartGroup] Items for store:', items);
  
  // Safety check that we have items
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center mb-3">
        <img 
          src={store.logo_url || 'https://via.placeholder.com/30'} 
          alt={store.nome || 'Loja'} 
          className="w-6 h-6 rounded-full object-cover mr-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/30';
          }}
        />
        <h2 className="font-bold">{store.nome || `Loja ${store.id.substring(0, 8)}`}</h2>
      </div>
      
      <Card className="divide-y divide-gray-100">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            processingItem={processingItem}
          />
        ))}
        
        {/* Store shipping */}
        <div className="p-3 bg-gray-50">
          <div className="flex justify-between text-sm">
            <span>Frete para esta loja</span>
            <span>R$ 15,90</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StoreCartGroup;
