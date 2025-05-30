
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, profile } = useAuth();
  
  // Get user type with default fallback
  const userType = React.useMemo(() => {
    const profileType = profile?.tipo_perfil || 'consumidor';
    return (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(profileType)) 
      ? profileType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
      : 'consumidor';
  }, [profile?.tipo_perfil]);
  
  console.log('[CartProvider] Rendering with:', { 
    isAuthenticated, 
    userId: user?.id, 
    userType 
  });
  
  // Get cart data - only when authenticated with valid user
  const { cart, isLoading, refreshCart, refreshKey } = useCartData(
    isAuthenticated, 
    user?.id || null, 
    userType
  );
  
  // Force update trigger for immediate counter updates
  const [updateTrigger, setUpdateTrigger] = React.useState(0);
  const forceUpdate = React.useCallback(() => {
    console.log('[CartProvider] Forcing immediate update');
    setUpdateTrigger(prev => prev + 1);
  }, []);
  
  // Get cart operations with force update capability
  const operations = useCartOperations(refreshCart, forceUpdate);

  // Calculate total items - UNIFIED and consistent calculation
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      console.log('[CartProvider] No cart items, returning 0');
      return 0;
    }
    // UNIFIED CALCULATION: Always sum the quantities
    const count = cart.items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
    console.log('[CartProvider] UNIFIED cart count calculation:', count, 'from items:', cart.items.length);
    return count;
  }, [cart?.items, refreshKey, updateTrigger]); // Include both refreshKey and updateTrigger
  
  const cartItems = cart?.items || [];

  console.log('[CartProvider] Final state:', {
    cartCount,
    itemsLength: cartItems.length,
    isLoading: isLoading || operations.isLoading,
    cartId: cart?.id,
    refreshKey,
    updateTrigger
  });

  // Enhanced refresh function with immediate trigger
  const enhancedRefreshCart = React.useCallback(async () => {
    console.log('[CartProvider] Enhanced refresh cart called');
    await refreshCart();
    forceUpdate();
  }, [refreshCart, forceUpdate]);

  // Create context value with unified counter and direct operations
  const value: CartContextType = {
    cart,
    cartCount, // This is the SINGLE SOURCE OF TRUTH for cart count
    cartItems,
    isLoading: isLoading || operations.isLoading,
    addToCart: operations.addToCart,
    updateQuantity: operations.updateQuantity,
    removeItem: operations.removeItem, // Use direct operation
    clearCart: operations.clearCart,   // Use direct operation
    refreshCart: enhancedRefreshCart
  };

  return <CartContextProvider value={value}>{children}</CartContextProvider>;
}

// Export useCart hook with unified counter
export function useCart() {
  try {
    const context = useCartContext();
    console.log('[useCart] Using UNIFIED counter:', {
      cartCount: context.cartCount,
      itemsLength: context.cartItems.length,
      isLoading: context.isLoading
    });
    return context;
  } catch (error) {
    console.warn('[useCart] Context not available, returning fallback');
    // Return fallback to prevent crashes
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
