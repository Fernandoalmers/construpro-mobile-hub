
import { supabase } from "@/integrations/supabase/client";
import { Product, getProductById } from "./productService";

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price_at_add: number;
  created_at?: string;
  updated_at?: string;
  produto?: Product;
  subtotal: number;
  preco: number;
  quantidade: number;
  pontos: number;
}

export interface Cart {
  id: string;
  user_id: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  items: CartItem[];
  stores?: { id: string; nome: string; logo_url?: string }[];
  summary: {
    subtotal: number;
    shipping: number;
    totalPoints: number;
  };
}

// Get current user's cart
export const getCart = async (): Promise<Cart | null> => {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }
    
    // Find active cart or create one
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();
    
    let cart;
    
    if (cartError) {
      if (cartError.code === 'PGRST116') {
        // No cart found, create a new one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({
            user_id: userData.user.id,
            status: 'active'
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating cart:', createError);
          return null;
        }
        
        cart = newCart;
      } else {
        console.error('Error fetching cart:', cartError);
        return null;
      }
    } else {
      cart = cartData;
    }
    
    // Get cart items
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id);
      
    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return null;
    }
    
    // Get product details for each item
    const items: CartItem[] = [];
    const stores = new Map();
    let subtotal = 0;
    let totalPoints = 0;
    
    for (const item of cartItems || []) {
      const product = await getProductById(item.product_id);
      if (product) {
        const itemSubtotal = item.price_at_add * item.quantity;
        const itemPoints = (product.pontos || 0) * item.quantity;
        
        items.push({
          id: item.id,
          cart_id: item.cart_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_add: item.price_at_add,
          created_at: item.created_at,
          updated_at: item.updated_at,
          produto: product,
          subtotal: itemSubtotal,
          preco: item.price_at_add,
          quantidade: item.quantity,
          pontos: itemPoints
        });
        
        subtotal += itemSubtotal;
        totalPoints += itemPoints;
        
        // Track stores
        if (product.loja_id && product.loja) {
          stores.set(product.loja_id, {
            id: product.loja_id,
            nome: product.loja.nome,
            logo_url: product.loja.logo_url
          });
        }
      }
    }
    
    return {
      id: cart.id,
      user_id: cart.user_id,
      status: cart.status,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
      items,
      stores: Array.from(stores.values()),
      summary: {
        subtotal,
        shipping: items.length > 0 ? 15.9 : 0, // Default shipping
        totalPoints
      }
    };
  } catch (error) {
    console.error('Error in getCart:', error);
    return null;
  }
};

// Add item to cart
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    // Get product details to know the current price
    const product = await getProductById(productId);
    if (!product) {
      console.error('Product not found');
      return null;
    }
    
    // Get or create cart
    const cart = await getCart();
    if (!cart) {
      console.error('Failed to get or create cart');
      return null;
    }
    
    // Check if product is already in cart
    const existingItem = cart.items.find(item => item.product_id === productId);
    
    if (existingItem) {
      // Update quantity
      return await updateCartItemQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      // Add new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity,
          price_at_add: product.preco
        });
        
      if (error) {
        console.error('Error adding item to cart:', error);
        return null;
      }
      
      return await getCart();
    }
  } catch (error) {
    console.error('Error in addToCart:', error);
    return null;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (itemId: string, quantity: number): Promise<Cart | null> => {
  try {
    if (quantity < 1) {
      return await removeFromCart(itemId);
    }
    
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
      
    if (error) {
      console.error('Error updating cart item quantity:', error);
      return null;
    }
    
    return await getCart();
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    return null;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId: string): Promise<Cart | null> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
      
    if (error) {
      console.error('Error removing item from cart:', error);
      return null;
    }
    
    return await getCart();
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return null;
  }
};

// Clear cart
export const clearCart = async (): Promise<boolean> => {
  try {
    const cart = await getCart();
    if (!cart) return false;
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);
      
    if (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in clearCart:', error);
    return false;
  }
};
