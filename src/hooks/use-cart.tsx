
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';

export async function addToCart(productId: string, quantity: number): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User not authenticated');
    }
    
    // Get or create active cart
    let { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // No active cart found, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: userData.user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          throw createError;
        }

        cartData = newCart;
      } else {
        throw cartError;
      }
    }
    
    // Check if product exists in cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartData.id)
      .eq('product_id', productId)
      .maybeSingle();
      
    // Get product price 
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('preco_normal, preco_promocional')
      .eq('id', productId)
      .single();
      
    if (productError) {
      throw productError;
    }
    
    const price = product.preco_promocional || product.preco_normal;
    
    if (existingItem) {
      // Update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
        
      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartData.id,
          product_id: productId,
          quantity: quantity,
          price_at_add: price
        });
        
      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  
  // Get cart data
  const { cart, isLoading, refreshCart } = useCartData(isAuthenticated, user?.id || null);
  
  // Get cart operations
  const operations = useCartOperations(refreshCart);

  // Calculate total items in cart - ensure it's using the latest cart data
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
  const cartItems = cart?.items || [];
  
  console.log('CartProvider: cartCount =', cartCount, 'isLoading =', isLoading);

  // Force refresh cart when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Authentication state changed, refreshing cart');
      refreshCart();
    }
  }, [isAuthenticated, user?.id, refreshCart]);

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
