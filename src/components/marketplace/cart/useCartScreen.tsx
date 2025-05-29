
import { useEffect } from 'react';
import { useCartData } from '@/hooks/cart/use-cart-data';
import { useAuth } from '@/context/AuthContext';
import { useCoupon } from '@/hooks/cart/use-coupon';
import { useNavigate } from 'react-router-dom';

export const useCartScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const {
    cart,
    cartItems,
    cartCount,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  } = useCartData(isAuthenticated, user?.id || null, user?.tipo_perfil || 'consumidor');

  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    isValidating
  } = useCoupon();

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

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(cartItemId);
    } else {
      await updateQuantity(cartItemId, newQuantity);
    }
    
    // Se houver cupom aplicado, remover pois os valores mudaram
    if (appliedCoupon) {
      removeCoupon();
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    await removeItem(cartItemId);
    
    // Se houver cupom aplicado, remover pois os itens mudaram
    if (appliedCoupon) {
      removeCoupon();
    }
  };

  const handleClearCart = async () => {
    await clearCart();
    
    // Remover cupom se houver
    if (appliedCoupon) {
      removeCoupon();
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.produto?.preco_promocional || item.produto?.preco_normal || item.preco || 0;
      const quantity = item.quantidade || 1;
      return total + (price * quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = appliedCoupon?.discount || 0;
    return Math.max(0, subtotal - discount);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    
    console.log('[useCartScreen] Proceeding to checkout with:', {
      cartItems: cartItems.length,
      appliedCoupon,
      total: calculateTotal()
    });
    
    navigate('/checkout');
  };

  return {
    // Cart data
    cart,
    cartItems,
    cartCount,
    isLoading,
    
    // Cart operations
    updateQuantity: handleQuantityChange,
    removeItem: handleRemoveItem,
    clearCart: handleClearCart,
    refreshCart,
    
    // Coupon data
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidating,
    
    // Coupon operations
    applyCoupon: handleApplyCoupon,
    removeCoupon,
    
    // Calculations
    calculateSubtotal,
    calculateTotal,
    
    // Navigation
    handleCheckout,
    
    // User info
    user,
    isAuthenticated
  };
};
