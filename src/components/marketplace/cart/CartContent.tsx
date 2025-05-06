
import React from 'react';
import { Cart } from '@/types/cart';
import StoreCartGroup from './StoreCartGroup';
import CouponSection from './CouponSection';

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
  console.log("[CartContent] Store keys:", Object.keys(itemsByStore));
  
  // Check cart has items
  const hasItems = cart?.items && cart.items.length > 0;
  const hasGroupedItems = Object.keys(itemsByStore).length > 0;
  
  console.log("[CartContent] Has items:", hasItems, "Has grouped items:", hasGroupedItems);

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {hasGroupedItems ? (
          Object.entries(itemsByStore).map(([storeId, { loja, items }]) => (
            <StoreCartGroup 
              key={storeId}
              store={loja}
              items={items}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              processingItem={processingItem}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Não há itens no carrinho ou dados ainda estão carregando.</p>
            {hasItems && (
              <p className="mt-2 text-sm">
                Há {cart?.items.length} item(s) no carrinho, mas não foram agrupados corretamente.
              </p>
            )}
          </div>
        )}
        
        <CouponSection 
          appliedCoupon={appliedCoupon}
          onApplyCoupon={onApplyCoupon}
          onRemoveCoupon={onRemoveCoupon}
        />
      </div>
    </div>
  );
};

export default CartContent;
