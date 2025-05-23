
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
  
  // Check for valid store data - show placeholder if missing
  const isValidStore = store && store.id;
  
  if (!isValidStore) {
    console.log('[StoreCartGroup] Invalid store, showing placeholder');
    return (
      <div className="mb-4">
        <div className="p-3 bg-gray-100 rounded-lg">
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
    <div className="mb-4">
      <div className="flex items-center mb-2 px-3 py-2 bg-white rounded-lg border-l-2 border-green-600 shadow-sm">
        {store.logo_url ? (
          <img 
            src={store.logo_url} 
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
            }}
          />
        ) : (
          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mr-2">
            <Building size={16} className="text-green-600" />
          </div>
        )}
        <div>
          <h2 className="font-medium text-sm text-gray-800">{displayName}</h2>
          <p className="text-xs text-gray-500">{items.length} {items.length === 1 ? 'produto' : 'produtos'}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            processingItem={processingItem}
          />
        ))}
        <div className="p-2 bg-gray-50 text-right rounded-lg border border-gray-100">
          <span className="text-xs font-medium">Subtotal: </span>
          <span className="text-sm font-medium text-green-600">R$ {storeSubtotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default StoreCartGroup;
