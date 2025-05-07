import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CartContextProvider, useCartContext } from '@/context/CartContext';
import { useCartData } from './cart/use-cart-data';
import { useCartOperations } from './cart/use-cart-operations';
import { CartContextType } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';

export async function addToCart(productId: string, quantity: number): Promise<void> {
  try {
    console.log(`[addToCart] Adding ${quantity} of product ${productId} to cart`);
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      console.error('[addToCart] User not authenticated');
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
        console.log('[addToCart] No active cart found, creating new one');
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: userData.user.id,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[addToCart] Error creating cart:', createError);
          throw createError;
        }

        cartData = newCart;
      } else {
        console.error('[addToCart] Error fetching cart:', cartError);
        throw cartError;
      }
    }
    
    console.log(`[addToCart] Using cart: ${cartData.id}`);
    
    // Get product price 
    const { data: product, error: productError } = await supabase
      .from('produtos')
      .select('preco_normal, preco_promocional')
      .eq('id', productId)
      .single();
      
    if (productError) {
      console.error('[addToCart] Error fetching product:', productError);
      throw productError;
    }
    
    const price = product.preco_promocional || product.preco_normal;
    
    // MODIFIED: Always add as a new item, don't check for existing items
    console.log(`[addToCart] Adding new item to cart`);
    const { error: insertError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartData.id,
        product_id: productId,
        quantity: quantity,
        price_at_add: price
      });
      
    if (insertError) {
      console.error('[addToCart] Error inserting item:', insertError);
      throw insertError;
    }
    
    console.log('[addToCart] Successfully added new cart item');
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
