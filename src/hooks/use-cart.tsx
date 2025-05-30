
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
  
  // Get cart data
  const { cart, isLoading, refreshCart, refreshKey } = useCartData(
    isAuthenticated, 
    user?.id || null, 
    userType
  );
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      return 0;
    }
    return cart.items.reduce((sum, item) => sum + (item.quantidade || 0), 0);
  }, [cart?.items]);
  
  const cartItems = cart?.items || [];

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

// Export useCart hook
export function useCart() {
  try {
    const context = useCartContext();
    return context;
  } catch (error) {
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
