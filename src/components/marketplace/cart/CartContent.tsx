
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import CouponSection from './CouponSection';
import EmptyCart from './EmptyCart';
import StoreCartGroup from './StoreCartGroup';

interface CartContentProps {
  cartItems: any[];
  itemsByStore: Record<string, any>;
  processingItem: string | null;
  appliedCoupon: {code: string, discount: number} | null;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  isValidating?: boolean;
}

const CartContent: React.FC<CartContentProps> = ({
  cartItems,
  itemsByStore,
  processingItem,
  appliedCoupon,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  isValidating = false
}) => {
  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="space-y-4">
      {/* Seção de cupons */}
      <CouponSection
        appliedCoupon={appliedCoupon}
        onApplyCoupon={onApplyCoupon}
        onRemoveCoupon={onRemoveCoupon}
        cartItems={cartItems}
        isValidating={isValidating}
      />

      {/* Itens do carrinho agrupados por loja */}
      <div className="space-y-4">
        {Object.entries(itemsByStore).map(([storeId, storeGroup]) => (
          <StoreCartGroup
            key={storeId}
            storeId={storeId}
            storeInfo={storeGroup.loja}
            items={storeGroup.items}
            onUpdateQuantity={async (item, quantity) => {
              onUpdateQuantity(item.id, quantity);
            }}
            onRemoveItem={async (itemId) => {
              onRemoveItem(itemId);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CartContent;
