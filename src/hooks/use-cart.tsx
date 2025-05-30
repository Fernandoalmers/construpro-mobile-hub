
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';
import { addToCart as addToCartService } from '@/services/cart/operations/addToCart';

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
  
  // Get user type with proper type guard and default
  const userType = React.useMemo(() => {
    const profileType = profile?.tipo_perfil || 'consumidor';
    return (['consumidor', 'profissional', 'lojista', 'vendedor'].includes(profileType)) 
      ? profileType as 'consumidor' | 'profissional' | 'lojista' | 'vendedor'
      : 'consumidor';
  }, [profile?.tipo_perfil]);
  
  // Get cart data with user type
  const { cart, isLoading, refreshCart, refreshKey } = useCartData(isAuthenticated, user?.id || null, userType);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart with enhanced reactivity
  const cartCount = React.useMemo(() => {
    if (!cart?.items || cart.items.length === 0) {
      console.log('[CartProvider] No cart items, count = 0, refreshKey:', refreshKey);
      return 0;
    }
    
    const count = cart.items.reduce((sum, item) => {
      return sum + (item.quantidade || 0);
    }, 0);
    
    console.log('[CartProvider] Calculated cart count:', count, 'from', cart.items.length, 'items, refreshKey:', refreshKey);
    return count;
  }, [cart?.items, refreshKey]); // Include refreshKey as dependency
  
  const cartItems = cart?.items || [];
  
  console.log('[CartProvider] Rendering with:', {
    cartCount,
    itemsLength: cartItems.length,
    isLoading,
    userType,
    hasCart: !!cart,
    cartId: cart?.id,
    refreshKey
  });

  // Force re-render when cart operations complete
  const [operationCompleted, setOperationCompleted] = React.useState(0);
  
  React.useEffect(() => {
    if (!operations.isLoading && operations.operationInProgress === null) {
      // Operation completed, force update
      setOperationCompleted(prev => prev + 1);
    }
  }, [operations.isLoading, operations.operationInProgress]);

  // Enhanced operations with forced refresh
  const enhancedOperations = React.useMemo(() => ({
    ...operations,
    removeItem: async (itemId: string) => {
      await operations.removeItem(itemId);
      setOperationCompleted(prev => prev + 1);
    },
    clearCart: async () => {
      await operations.clearCart();
      setOperationCompleted(prev => prev + 1);
    }
  }), [operations]);

  // Create context value with enhanced reactivity
  const value: CartContextType = {
    cart,
    cartCount,
    cartItems,
    isLoading: isLoading || operations.isLoading,
    addToCart: enhancedOperations.addToCart,
    updateQuantity: enhancedOperations.updateQuantity,
    removeItem: enhancedOperations.removeItem,
    clearCart: enhancedOperations.clearCart,
    refreshCart
  };

  return <CartContextProvider value={value}>{children}</CartContextProvider>;
}

// Re-export the useCartContext as useCart with enhanced error handling
export function useCart() {
  try {
    const context = useCartContext();
    console.log('[useCart] Context values:', {
      cartCount: context.cartCount,
      itemsLength: context.cartItems.length,
      isLoading: context.isLoading,
      timestamp: new Date().toISOString()
    });
    return context;
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
