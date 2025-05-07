
import React from 'react';
import { Cart } from '@/types/cart';
import StoreCartGroup from './StoreCartGroup';
import CouponSection from './CouponSection';
import { AlertTriangle, ShoppingBag } from 'lucide-react';

interface CartContentProps {
  cart: Cart | null;
  itemsByStore: Record<string, { loja: any, items: any[] }>;
  processingItem: string | null;
  appliedCoupon: {code: string, discount: number} | null;
  onUpdateQuantity: (item: any, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

const CartContent: React.FC<CartContentProps> = ({
  cart,
  itemsByStore,
  processingItem,
  appliedCoupon,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  console.log("[CartContent] Rendering with items by store:", itemsByStore);
  
  // Check cart has items
  const hasItems = cart?.items && cart.items.length > 0;
  const hasGroupedItems = Object.keys(itemsByStore).length > 0;
  
  const storeCount = Object.keys(itemsByStore).length;
  
  // If cart has items but they're not grouped, we might have a mapping issue
  const hasMappingIssue = hasItems && !hasGroupedItems;

  return (
    <div className="space-y-4">
      {hasItems && (
        <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
          <div className="flex items-center text-gray-700">
            <ShoppingBag size={16} className="mr-2" />
            <span className="text-sm font-medium">
              {cart?.items.length} {cart?.items.length === 1 ? 'item' : 'itens'} em {storeCount} {storeCount === 1 ? 'loja' : 'lojas'}
            </span>
          </div>
        </div>
      )}
      
      {hasGroupedItems ? (
        <div className="space-y-5">
          {Object.entries(itemsByStore).map(([storeId, { loja, items }]) => (
            <StoreCartGroup 
              key={storeId}
              store={loja}
              items={items}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              processingItem={processingItem}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 bg-white rounded-lg shadow p-8">
          {hasMappingIssue ? (
            <div className="flex flex-col items-center">
              <AlertTriangle size={36} className="text-amber-500 mb-2" />
              <p className="font-medium">Erro ao exibir os itens do carrinho</p>
              <p className="mt-2 text-sm">
                Há {cart?.items.length} item(s) no carrinho, mas não foi possível organizá-los corretamente.
              </p>
            </div>
          ) : (
            <p>Não há itens no carrinho ou dados ainda estão carregando.</p>
          )}
        </div>
      )}
      
      <CouponSection 
        appliedCoupon={appliedCoupon}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={onRemoveCoupon}
      />
    </div>
  );
};

export default CartContent;
