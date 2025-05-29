
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
  if (!items || items.length === 0) {
    return null;
  }
  
  const isValidStore = store && store.id;
  
  if (!isValidStore) {
    return (
      <div className="mb-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <p className="text-gray-500 text-center text-xs">Carregando informações da loja...</p>
        </div>
      </div>
    );
  }

  const storeSubtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const displayName = store.nome || `Loja ${store.id.substring(0, 4)}`;
  
  return (
    <div className="mb-3">
      {/* Store header - mais compacto */}
      <div className="flex items-center mb-2 px-2 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border-l-3 border-blue-500">
        {store.logo_url ? (
          <img 
            src={store.logo_url} 
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover mr-2 border border-white shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/24';
            }}
          />
        ) : (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 border border-white shadow-sm">
            <Building size={12} className="text-blue-600" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="font-semibold text-xs text-gray-800">{displayName}</h2>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {items.length} {items.length === 1 ? 'produto' : 'produtos'} • R$ {storeSubtotal.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Store items - espaçamento reduzido */}
      <div className="space-y-1.5">
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
