
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
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items - ensure we're getting the right count
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      console.log('[CartProvider] No cart items, returning 0');
      return 0;
    }
    const count = cart.items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
    console.log('[CartProvider] Calculated cart count:', count, 'from items:', cart.items.length);
    return count;
  }, [cart?.items, refreshKey]); // Include refreshKey to force recalculation
  
  const cartItems = cart?.items || [];

  console.log('[CartProvider] Final state:', {
    cartCount,
    itemsLength: cartItems.length,
    isLoading: isLoading || operations.isLoading,
    cartId: cart?.id
  });

  // Create context value
  const value: CartContextType = {
    cart,
    cartCount,
    cartItems,
    isLoading: isLoading || operations.isLoading,
    addToCart: operations.addToCart,
    updateQuantity: operations.updateQuantity,
    removeItem: operations.removeItem,
    clearCart: operations.clearCart,
    refreshCart
  };

  return <CartContextProvider value={value}>{children}</CartContextProvider>;
}

// Export useCart hook with better error handling
export function useCart() {
  try {
    const context = useCartContext();
    console.log('[useCart] Context values:', {
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
