
import React from 'react';
import { CartItem as CartItemType } from '@/types/cart';
import CartItem from './CartItem';
import { Building, MapPin } from 'lucide-react';

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
      {/* Store header */}
      <div className="flex items-center mb-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
        {store.logo_url ? (
          <img 
            src={store.logo_url} 
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-white shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
            }}
          />
        ) : (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 border-2 border-white shadow-sm">
            <Building size={18} className="text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800">{displayName}</h2>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {items.length} {items.length === 1 ? 'produto' : 'produtos'} • Subtotal: R$ {storeSubtotal.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Store items */}
      <div className="space-y-3">
        {items.map(item => (
          <CartItem 
            key={item.id} 
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            processingItem={processingItem}
          />
        ))}
      </div>
    </div>
  );
};

export default StoreCartGroup;
