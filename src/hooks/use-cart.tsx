
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';
import { addToCart as addToCartService } from '@/services/cart/operations/addToCart';
import { cleanupAbandonedCarts } from '@/services/cart/cartCleanup';

export async function addToCart(productId: string, quantity: number): Promise<void> {
  try {
    console.log(`[addToCart] Adding ${quantity} of product ${productId} to cart`);
    
    await addToCartService(productId, quantity);
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, profile } = useAuth();
  
  // Get user type with proper type guard
  const userType = profile?.tipo_perfil || 'consumidor';
  const validUserType = (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(userType)) 
    ? userType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
    : 'consumidor';
  
  // Get cart data with user type
  const { cart, isLoading, refreshCart } = useCartData(isAuthenticated, user?.id || null, validUserType);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart - simplified and more reliable
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      return 0;
    }
    
    return cart.items.reduce((sum, item) => {
      return sum + (item.quantidade || 0);
    }, 0);
  }, [cart?.items]);
  
  const cartItems = cart?.items || [];
  
  console.log('[CartProvider] cartCount =', cartCount, 'cartItems.length =', cartItems.length, 'isLoading =', isLoading, 'userType =', validUserType);

  // Cleanup abandoned carts periodically - but not on every render
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Run cart cleanup once when component mounts - with delay to not block initial load
      const timeoutId = setTimeout(async () => {
        try {
          console.log('[CartProvider] Running background cart cleanup');
          await cleanupAbandonedCarts();
        } catch (error) {
          console.error('[CartProvider] Error during cart cleanup:', error);
        }
      }, 5000); // Wait 5 seconds after mount
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user?.id]); // Only run when auth state changes

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

// Re-export the useCartContext as useCart for backward compatibility
export function useCart() {
  try {
    return useCartContext();
  } catch (error) {
    console.error('useCart must be used within a CartProvider');
    // Return a fallback with no-op functions to prevent crashes
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
