import { useEffect, useMemo } from 'react';
import { useCartData } from '@/hooks/cart/use-cart-data';
import { useAuth } from '@/context/AuthContext';
import { useCoupon } from '@/hooks/cart/use-coupon';
import { useNavigate } from 'react-router-dom';
import { useGroupItemsByStore } from '@/hooks/cart/use-group-items-by-store';
import { useCartTotals } from '@/hooks/cart/use-cart-totals';
import { useCartOperations } from '@/hooks/cart/use-cart-operations';
import { useStoreInfo } from '@/hooks/cart/use-store-info';
import { supabase } from '@/integrations/supabase/client';

export const useCartScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const {
    cart,
    isLoading,
    error,
    refreshCart
  } = useCartData(isAuthenticated, user?.id || null, (user as any)?.tipo_perfil || 'consumidor');

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

  // Extract unique store IDs from cart items - CORRIGIDO: usar apenas loja_id
  const storeIds = useMemo(() => {
    const ids = cartItems.map(item => item.produto?.loja_id).filter(Boolean);
    return [...new Set(ids)];
  }, [cartItems]);

  // Fetch store information
  const { storeInfo, loading: storeLoading } = useStoreInfo(storeIds);

  // Group items by store with store info
  const { groupedItems } = useGroupItemsByStore(cartItems);

  // Enhance grouped items with store information
  const enhancedGroupedItems = useMemo(() => {
    const enhanced: Record<string, any> = {};
    
    Object.entries(groupedItems).forEach(([storeId, group]) => {
      const storeData = storeInfo[storeId] || {
        id: storeId,
        nome: `Loja ${storeId.substring(0, 4)}`,
        logo_url: null
      };
      
      enhanced[storeId] = {
        ...group,
        loja: storeData
      };
    });
    
    return enhanced;
  }, [groupedItems, storeInfo]);

  // Calculate totals
  const { subtotal, shipping, discount, total, totalPoints } = useCartTotals(
    cartItems,
    Object.keys(enhancedGroupedItems).length,
    appliedCoupon?.discount || 0,
    0,
    (user as any)?.tipo_perfil || 'consumidor'
  );

  // Derived states
  const cartIsEmpty = cartItems.length === 0;

  // Execute database coupon fix on component mount
  useEffect(() => {
    const executeCouponFix = async () => {
      try {
        console.log('[useCartScreen] Executing coupon database fix...');
        await supabase.functions.invoke('fix-coupon-validation');
        console.log('[useCartScreen] Coupon database fix completed');
      } catch (error) {
        console.log('[useCartScreen] Coupon fix already applied or error:', error);
      }
    };

    // Execute fix once when component mounts
    executeCouponFix();
  }, []);

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

    console.log('[useCartScreen] Aplicando cupom com dados do carrinho:', {
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
    loading: isLoading || operationsLoading || storeLoading,
    error: error?.message || null,
    cartIsEmpty,
    
    // Cart data
    cart,
    cartItems,
    cartCount,
    itemsByStore: enhancedGroupedItems,
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
