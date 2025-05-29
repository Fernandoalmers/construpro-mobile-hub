
import { useEffect, useMemo } from 'react';
import { useCartData } from '@/hooks/cart/use-cart-data';
import { useAuth } from '@/context/AuthContext';
import { useCoupon } from '@/hooks/cart/use-coupon';
import { useNavigate } from 'react-router-dom';
import { useGroupItemsByStore } from '@/hooks/cart/use-group-items-by-store';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { useCartOperations } from '@/hooks/cart/use-cart-operations';

export const useCartScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const {
    cart,
    isLoading,
    error,
    refreshCart
  } = useCartData(isAuthenticated, user?.id || null, (user as any)?.tipo_perfil || 'consumidor');

  // Get cart operations with refresh callback
  const {
    updateQuantity,
    removeItem,
    clearCart,
    isLoading: operationsLoading,
    operationInProgress
  } = useCartOperations(refreshCart);

  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isValidating
  } = useCoupon();

  // Extract cart items from cart object
  const cartItems = cart?.items || [];
  const cartCount = cartItems.length;

  // Group items by store
  const { groupedItems } = useGroupItemsByStore(cartItems);

  // Calculate totals
  const { subtotal, shipping, discount, total, totalPoints } = useCartTotals(
    cartItems,
    Object.keys(groupedItems).length,
    appliedCoupon?.discount || 0,
    0,
    (user as any)?.tipo_perfil || 'consumidor'
  );

  // Derived states
  const cartIsEmpty = cartItems.length === 0;

  // Atualizar carrinho quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCart();
    }
  }, [isAuthenticated, user?.id, refreshCart]);

  const handleApplyCoupon = async (code: string) => {
    if (!user?.id) {
      console.error('[useCartScreen] No user ID available for coupon application');
      return;
    }

    // Calcular valor total do carrinho
    const orderValue = cartItems.reduce((total, item) => {
      const price = item.produto?.preco_promocional || item.produto?.preco_normal || item.preco || 0;
      const quantity = item.quantidade || 1;
      return total + (price * quantity);
    }, 0);

    console.log('[useCartScreen] Applying coupon with cart data:', {
      code,
      orderValue,
      userId: user.id,
      cartItems: cartItems.map(item => ({
        id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco: item.produto?.preco_promocional || item.produto?.preco_normal || item.preco
      }))
    });

    await applyCoupon(code, orderValue, user.id, cartItems);
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    try {
      console.log('[useCartScreen] Updating quantity:', cartItemId, newQuantity);
      
      if (newQuantity <= 0) {
        await removeItem(cartItemId);
      } else {
        await updateQuantity(cartItemId, newQuantity);
      }
      
      // Se houver cupom aplicado, remover pois os valores mudaram
      if (appliedCoupon) {
        removeCoupon();
      }
    } catch (error) {
      console.error('[useCartScreen] Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      console.log('[useCartScreen] Removing item:', cartItemId);
      await removeItem(cartItemId);
      
      // Se houver cupom aplicado, remover pois os itens mudaram
      if (appliedCoupon) {
        removeCoupon();
      }
    } catch (error) {
      console.error('[useCartScreen] Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    try {
      console.log('[useCartScreen] Clearing cart');
      await clearCart();
      
      // Remover cupom se houver
      if (appliedCoupon) {
        removeCoupon();
      }
    } catch (error) {
      console.error('[useCartScreen] Error clearing cart:', error);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    
    console.log('[useCartScreen] Proceeding to checkout with:', {
      cartItems: cartItems.length,
      appliedCoupon,
      total: total
    });
    
    navigate('/checkout');
  };

  return {
    // States
    loading: isLoading || operationsLoading,
    error: error?.message || null,
    cartIsEmpty,
    
    // Cart data
    cart,
    cartItems,
    cartCount,
    itemsByStore: groupedItems,
    processingItem: operationInProgress,
    
    // Coupon data
    appliedCoupon,
    couponCode,
    setCouponCode,
    isValidating,
    
    // Totals
    subtotal,
    discount,
    shipping,
    total,
    totalPoints,
    
    // Actions
    refreshCart,
    handleUpdateQuantity,
    handleRemoveItem,
    clearCart: handleClearCart,
    applyCoupon: handleApplyCoupon,
    removeCoupon,
    handleCheckout,
    
    // User info
    user,
    isAuthenticated
  };
};
