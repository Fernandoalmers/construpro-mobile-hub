
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  produtoId: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  pontos: number;
  produto: any;
}

export interface CartSummary {
  subtotal: number;
  totalPoints: number;
  shipping: number;
  total: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  stores: any[];
  summary: CartSummary;
}

export interface CheckoutRequest {
  addressId: string;
  paymentMethod: string;
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  message: string;
  error?: string;
  pointsEarned?: number;
}

export const cartService = {
  async getCart(): Promise<Cart> {
    const { data, error } = await supabase.functions.invoke('marketplace-management');
    
    if (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
    
    return data as Cart;
  },
  
  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    const { data, error } = await supabase.functions.invoke('marketplace-management', {
      body: { 
        action: 'add_to_cart', 
        productId, 
        quantity 
      }
    });
    
    if (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
    
    return data as Cart;
  },
  
  async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<Cart> {
    const { data, error } = await supabase.functions.invoke('marketplace-management', {
      body: { 
        action: 'update_quantity', 
        cartItemId, 
        quantity 
      }
    });
    
    if (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
    
    return data as Cart;
  },
  
  async removeFromCart(cartItemId: string): Promise<Cart> {
    const { data, error } = await supabase.functions.invoke('marketplace-management', {
      body: { 
        action: 'remove_from_cart', 
        cartItemId 
      }
    });
    
    if (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
    
    return data as Cart;
  },
  
  async clearCart(): Promise<void> {
    const { error } = await supabase.functions.invoke('marketplace-management', {
      body: { action: 'clear_cart' }
    });
    
    if (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
  
  async checkout(checkoutRequest: CheckoutRequest): Promise<CheckoutResponse> {
    const { data, error } = await supabase.functions.invoke('marketplace-management', {
      body: { 
        action: 'checkout',
        addressId: checkoutRequest.addressId,
        paymentMethod: checkoutRequest.paymentMethod
      }
    });
    
    if (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
    
    return data as CheckoutResponse;
  },

  async addToFavorites(productId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('marketplace-management', {
      body: { 
        action: 'add_to_favorites',
        productId
      }
    });
    
    if (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
    
    return data as { success: boolean; message: string };
  },

  async removeFromFavorites(productId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.functions.invoke('marketplace-management', {
      body: { 
        action: 'remove_from_favorites',
        productId
      }
    });
    
    if (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
    
    return data as { success: boolean; message: string };
  }
}
