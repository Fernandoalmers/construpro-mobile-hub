
import React from 'react';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import CartHeader from './cart/CartHeader';
import EmptyCart from './cart/EmptyCart';
import CartContent from './cart/CartContent';
import CartSummary from './cart/CartSummary';
import { useCartScreen } from './cart/useCartScreen';

const CartScreen: React.FC = () => {
  const {
    loading,
    error,
    cartIsEmpty,
    cart,
    itemsByStore,
    processingItem,
    appliedCoupon,
    subtotal,
    discount,
    shipping,
    total,
    totalPoints,
    refreshCart,
    handleUpdateQuantity,
    handleRemoveItem,
    applyCoupon,
    removeCoupon
  } = useCartScreen();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <CartHeader />
        <LoadingState type="spinner" text="Carregando seu carrinho..." count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <CartHeader />
        <ErrorState 
          title="Erro ao carregar o carrinho" 
          message={error} 
          onRetry={() => refreshCart()} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      <CartHeader />

      {cartIsEmpty ? (
        <EmptyCart />
      ) : (
        <>
          <div className="flex-1 p-4">
            <CartContent
              cart={cart}
              itemsByStore={itemsByStore}
              processingItem={processingItem}
              appliedCoupon={appliedCoupon}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
            />
          </div>
          
          <CartSummary
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            totalPoints={totalPoints}
          />
        </>
      )}
    </div>
  );
};

export default CartScreen;
