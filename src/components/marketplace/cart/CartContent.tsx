
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import CouponSection from './CouponSection';
import EmptyCart from './EmptyCart';
import StoreCartGroup from './StoreCartGroup';
import { useGroupItemsByStore } from '@/hooks/cart/use-group-items-by-store';

interface CartContentProps {
  cartItems: any[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  subtotal: number;
  total: number;
  onCheckout: () => void;
  appliedCoupon: {code: string, discount: number} | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  isValidating?: boolean;
}

const CartContent: React.FC<CartContentProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  subtotal,
  total,
  onCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  isValidating = false
}) => {
  const { groupedItems, storeInfo } = useGroupItemsByStore(cartItems);

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
        {Object.entries(groupedItems).map(([storeId, items]) => (
          <StoreCartGroup
            key={storeId}
            storeId={storeId}
            storeInfo={storeInfo[storeId]}
            items={items}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>

      {/* Resumo do carrinho */}
      <CartSummary
        subtotal={subtotal}
        discount={appliedCoupon?.discount || 0}
        total={total}
        onCheckout={onCheckout}
        onClearCart={onClearCart}
        itemCount={cartItems.length}
        appliedCoupon={appliedCoupon}
      />
    </div>
  );
};

export default CartContent;
