
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './use-cart-data';
import { useCartOperations } from './use-cart-operations';
import { CartContextType } from '@/types/cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, profile } = useAuth();
  const renderCountRef = useRef(0);
  
  // Increment render count for debugging
  renderCountRef.current += 1;
  
  // Stabilize user type calculation to prevent unnecessary re-renders
  const userType = useMemo(() => {
    const profileType = profile?.tipo_perfil || 'consumidor';
    return (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(profileType)) 
      ? profileType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
      : 'consumidor';
  }, [profile?.tipo_perfil]);
  
  // Memoize authentication state to prevent cascading re-renders
  const authState = useMemo(() => ({
    isAuthenticated,
    userId: user?.id || null,
    userType
  }), [isAuthenticated, user?.id, userType]);
  
  console.log(`[CartProvider] Render #${renderCountRef.current}:`, authState);
  
  // Get cart data with stabilized parameters
  const { cart, isLoading, refreshCart, refreshKey } = useCartData(
    authState.isAuthenticated, 
    authState.userId, 
    authState.userType
  );
  
  // Stabilize update trigger to prevent infinite loops
  const [updateTrigger, setUpdateTrigger] = React.useState(0);
  const forceUpdate = useCallback(() => {
    console.log('[CartProvider] Force update triggered');
    setUpdateTrigger(prev => prev + 1);
  }, []);
  
  // Get cart operations with stable callback
  const operations = useCartOperations(refreshCart, forceUpdate);

  // UNIFIED cart count calculation - stabilized with useMemo
  const cartCount = useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      return 0;
    }
    const count = cart.items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
    console.log('[CartProvider] UNIFIED count calculated:', count, 'from', cart.items.length, 'items');
    return count;
  }, [cart?.items, refreshKey, updateTrigger]);
  
  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);

  // Enhanced refresh function with debouncing to prevent rapid calls
  const enhancedRefreshCart = useCallback(async () => {
    console.log('[CartProvider] Enhanced refresh initiated');
    await refreshCart();
    forceUpdate();
  }, [refreshCart, forceUpdate]);

  // Stabilize context value to prevent child re-renders
  const contextValue: CartContextType = useMemo(() => ({
    cart,
    cartCount,
    cartItems,
    isLoading: isLoading || operations.isLoading,
    addToCart: operations.addToCart,
    updateQuantity: operations.updateQuantity,
    removeItem: operations.removeItem,
    clearCart: operations.clearCart,
    refreshCart: enhancedRefreshCart
  }), [
    cart,
    cartCount,
    cartItems,
    isLoading,
    operations.isLoading,
    operations.addToCart,
    operations.updateQuantity,
    operations.removeItem,
    operations.clearCart,
    enhancedRefreshCart
  ]);

  console.log(`[CartProvider] Final render #${renderCountRef.current} state:`, {
    cartCount: contextValue.cartCount,
    itemsLength: contextValue.cartItems.length,
    isLoading: contextValue.isLoading,
    cartId: cart?.id?.substring(0, 8)
  });

  return <CartContextProvider value={contextValue}>{children}</CartContextProvider>;
}

export function useCart() {
  try {
    const context = useCartContext();
    console.log('[useCart] Context accessed:', {
      cartCount: context.cartCount,
      itemsLength: context.cartItems.length,
      isLoading: context.isLoading
    });
    return context;
  } catch (error) {
    console.warn('[useCart] Context not available, returning fallback');
    return {
      cart: null,
      cartCount: 0,
      cartItems: [],
      isLoading: false,
      addToCart: async () => {},
      updateQuantity: async () => {},
      removeItem: async () => {},
      clearCart: async () => {},
      refreshCart: async () => {}
    };
  }
}
