
import React from 'react';
import { Cart } from '@/types/cart';
import StoreCartGroup from './StoreCartGroup';
import CouponSection from './CouponSection';

interface CartContentProps {
  cart: Cart;
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
  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {Object.values(itemsByStore).map(store => (
          <StoreCartGroup 
            key={store.loja.id}
            store={store.loja}
            items={store.items}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            processingItem={processingItem}
          />
        ))}
        
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
