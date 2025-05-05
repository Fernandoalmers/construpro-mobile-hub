
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  
  // Get cart data
  const { cart, isLoading, refreshCart } = useCartData(isAuthenticated, user?.id || null);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart - ensure it's using the latest cart data
  const cartCount = cart?.summary?.totalItems || 0;

  // Create context value
  const value: CartContextType = {
    cart,
    cartCount,
    isLoading: isLoading || operations.isLoading,
    addToCart: operations.addToCart,
    updateQuantity: operations.updateQuantity,
    removeItem: operations.removeItem,
    clearCart: operations.clearCart,
    refreshCart
  };

  return <CartContextProvider value={value}>{children}</CartContextProvider>;
}

// Re-export the useCartContext as useCart for backward compatibility
export function useCart() {
  return useCartContext();
}
