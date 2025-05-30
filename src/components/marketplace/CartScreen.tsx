
import React from 'react';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import CartHeader from './cart/CartHeader';
import EmptyCart from './cart/EmptyCart';
import CartContent from './cart/CartContent';
import CartSummary from './cart/CartSummary';
import { useCartScreen } from './cart/useCartScreen';
import { useAuth } from '@/context/AuthContext';

const CartScreen: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const {
    loading,
    error,
    cartIsEmpty,
    cart,
    cartItems,
    itemsByStore,
    processingItem,
    appliedCoupon,
    subtotal,
    discount,
    total,
    totalPoints,
    refreshCart,
    handleUpdateQuantity,
    handleRemoveItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    handleCheckout,
    isValidating
  } = useCartScreen();

  // Show authentication check first
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <CartHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <ErrorState 
            title="Acesso restrito" 
            message="Você precisa estar logado para acessar o carrinho" 
            onRetry={() => window.location.href = '/login?redirect=/cart'} 
            retryText="Fazer Login"
          />
        </div>
      </div>
    );
  }

  // Show loading state with timeout protection
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <CartHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <LoadingState type="spinner" text="Carregando seu carrinho..." count={1} />
            <div className="text-sm text-gray-500">
              Se o carregamento demorar muito, tente recarregar a página
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <CartHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <ErrorState 
            title="Erro ao carregar o carrinho" 
            message={error} 
            onRetry={refreshCart} 
          />
        </div>
      </div>
    );
  }

  // Safety check for cart data
  if (!cart) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <CartHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <ErrorState 
            title="Carrinho indisponível" 
            message="Não foi possível carregar os dados do carrinho. Tente novamente." 
            onRetry={refreshCart} 
          />
        </div>
      </div>
    );
  }

  // Add debug information
  console.log("CartScreen rendering with:", { 
    cartIsEmpty, 
    itemCount: cartItems?.length || 0,
    storeCount: Object.keys(itemsByStore || {}).length,
    loading,
    error
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <CartHeader />

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {cartIsEmpty ? (
          <EmptyCart />
        ) : (
          <>
            <CartContent
              cartItems={cartItems}
              itemsByStore={itemsByStore}
              processingItem={processingItem}
              appliedCoupon={appliedCoupon}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
              isValidating={isValidating}
            />
            
            <CartSummary
              subtotal={subtotal}
              discount={discount}
              total={total}
              onCheckout={handleCheckout}
              onClearCart={clearCart}
              itemCount={cartItems.length}
              appliedCoupon={appliedCoupon}
            />
          </>
        )}
      </div>
      
      {!cartIsEmpty && <div className="h-24" />}
    </div>
  );
};

export default CartScreen;
