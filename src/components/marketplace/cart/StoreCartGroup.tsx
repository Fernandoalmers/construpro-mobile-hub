
import React from 'react';
import Card from '@/components/common/Card';
import { CartItem as CartItemType } from '@/types/cart';
import CartItem from './CartItem';
import { Building } from 'lucide-react';

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
  if (!items || items.length === 0) {
    console.log('[StoreCartGroup] No items, not rendering');
    return null;
  }
  
  if (!store?.id) {
    console.log('[StoreCartGroup] Invalid store, not rendering');
    return (
      <div className="mb-6">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-500 text-center">Carregando informações da loja...</p>
        </div>
      </div>
    );
  }

  // Calculate store subtotal - with safety check
  const storeSubtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  
  // Format store name consistently to avoid flickering - use store.nome 
  // but fallback to a consistent format based on ID
  const displayName = store.nome || `Loja ${store.id.substring(0, 6)}`;
  
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3 px-4 py-3 bg-white rounded-lg border-l-4 border-green-600 shadow-sm">
        {store.logo_url ? (
          <img 
            src={store.logo_url} 
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
            }}
          />
        ) : (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <Building size={18} className="text-green-600" />
          </div>
        )}
        <div>
          <h2 className="font-bold text-md text-gray-800">{displayName}</h2>
          <p className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'produto' : 'produtos'}</p>
        </div>
      </div>
      
      <Card className="divide-y divide-gray-100 shadow-md rounded-xl overflow-hidden">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            processingItem={processingItem}
          />
        ))}
        <div className="p-4 bg-gray-50 text-right rounded-b-xl">
          <span className="text-sm font-medium">Subtotal da loja: </span>
          <span className="font-bold text-green-600">R$ {storeSubtotal.toFixed(2)}</span>
        </div>
      </Card>
    </div>
  );
};

export default StoreCartGroup;
