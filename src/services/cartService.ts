import { supabase } from "@/integrations/supabase/client";

// Define interface for product to ensure TypeScript recognizes its properties
interface Product {
  id: string;
  nome: string;
  preco: number;
  pontos?: number;
  estoque?: number;
  imagem_url?: string;
  avaliacao?: number;
  preco_anterior?: number;
  descricao?: string;
  loja_id?: string;
  stores?: {
    id: string;
    nome: string;
    logo_url?: string;
  };
}

export interface CartItem {
  id: string;
  produtoId: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  pontos: number;
  produto: Product;
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get user's active cart or create one if it doesn't exist
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (cartError && cartError.code === 'PGRST116') {
        // Cart doesn't exist, create one
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: user.id, status: 'active' })
          .select()
          .single();
        
        if (createError) throw createError;
        cartData = newCart;
      } else if (cartError) {
        throw cartError;
      }
      
      // Get cart items
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          price_at_add,
          product_id,
          products:product_id (
            id,
            nome,
            preco,
            pontos,
            estoque,
            imagem_url,
            descricao,
            loja_id,
            stores:loja_id (
              id,
              nome,
              logo_url
            )
          )
        `)
        .eq('cart_id', cartData.id);
      
      if (itemsError) throw itemsError;
      
      // Format cart items
      const items: CartItem[] = (cartItems || []).map(item => {
        // Safely access properties with null checks and type assertions
        const product = (item.products || {}) as Product;
        const preco = product.preco ?? item.price_at_add ?? 0;
        const quantidade = item.quantity || 0;
        const pontos = product.pontos ?? 0;
        
        return {
          id: item.id,
          produtoId: item.product_id,
          quantidade,
          preco,
          subtotal: preco * quantidade,
          pontos: pontos * quantidade,
          produto: product
        };
      });
      
      // Get all stores with products in cart
      const storeIds = [...new Set(items.map(item => item.produto?.stores?.id).filter(Boolean))];
      const stores = items
        .map(item => item.produto?.stores)
        .filter(Boolean)
        .filter((store, index, self) => 
          index === self.findIndex(s => s.id === store.id)
        );
      
      // Calculate summary
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalPoints = items.reduce((sum, item) => sum + item.pontos, 0);
      const shipping = storeIds.length * 15.9; // 15.90 per store
      
      return {
        cartId: cartData.id,
        items,
        stores,
        summary: {
          subtotal,
          totalPoints,
          shipping,
          total: subtotal + shipping
        }
      };
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },
  
  async addToCart(productId: string, quantity: number = 1): Promise<Cart> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get the product to add
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, preco, pontos, estoque')
        .eq('id', productId)
        .single();
      
      if (productError) throw productError;
      if (!product) throw new Error('Product not found');
      
      // Check stock
      const estoque = product.estoque || 0;
      if (estoque < quantity) {
        throw new Error(`Only ${estoque} units available in stock`);
      }
      
      // Get or create active cart
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (cartError && cartError.code === 'PGRST116') {
        // Create new cart
        const { data: newCart, error: createCartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id, status: 'active' })
          .select()
          .single();
        
        if (createCartError) throw createCartError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }
      
      // Check if the item is already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', productId)
        .single();
      
      if (existingItem) {
        // Update quantity if already in cart
        const newQuantity = existingItem.quantity + quantity;
        
        // Check if new quantity exceeds available stock
        if (newQuantity > estoque) {
          throw new Error(`Cannot add more units. Maximum stock reached (${estoque}).`);
        }
        
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);
        
        if (updateError) throw updateError;
      } else {
        // Add new item to cart
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            quantity: quantity,
            price_at_add: product.preco || 0
          });
        
        if (insertError) throw insertError;
      }
      
      // Return updated cart
      return await this.getCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },
  
  async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<Cart> {
    try {
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than zero');
      }
      
      // Get the cart item to update
      const { data: cartItem, error: itemError } = await supabase
        .from('cart_items')
        .select('product_id')
        .eq('id', cartItemId)
        .single();
      
      if (itemError) throw itemError;
      
      // Check product stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('estoque')
        .eq('id', cartItem.product_id)
        .single();
      
      if (productError) throw productError;
      
      const estoque = product?.estoque || 0;
      if (quantity > estoque) {
        throw new Error(`Only ${estoque} units available in stock`);
      }
      
      // Update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);
      
      if (updateError) throw updateError;
      
      // Return updated cart
      return await this.getCart();
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  },
  
  async removeFromCart(cartItemId: string): Promise<Cart> {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      
      if (error) throw error;
      
      // Return updated cart
      return await this.getCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },
  
  async clearCart(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get active cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (cartError) {
        if (cartError.code === 'PGRST116') return; // No cart to clear
        throw cartError;
      }
      
      // Delete all items in cart
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
      
      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
  
  async checkout(checkoutRequest: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Get cart with items
      const cart = await this.getCart();
      if (!cart.items.length) {
        throw new Error('Cart is empty');
      }
      
      // Get address
      const { data: address, error: addressError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', checkoutRequest.addressId)
        .eq('user_id', user.id)
        .single();
      
      if (addressError) throw addressError;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          cliente_id: user.id,
          valor_total: cart.summary.total,
          pontos_ganhos: cart.summary.totalPoints,
          status: 'Em Separação',
          forma_pagamento: checkoutRequest.paymentMethod,
          endereco_entrega: address
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        subtotal: item.subtotal
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Add points to user
      if (cart.summary.totalPoints > 0) {
        const { error: pointsError } = await supabase
          .from('points_transactions')
          .insert({
            user_id: user.id,
            pontos: cart.summary.totalPoints,
            tipo: 'compra',
            referencia_id: order.id,
            descricao: `Pontos ganhos na compra #${order.id}`
          });
        
        if (pointsError) throw pointsError;
        
        // Update user points balance
        const { error: profileError } = await supabase.rpc(
          'update_user_points',
          { 
            user_id: user.id, 
            points_to_add: cart.summary.totalPoints 
          }
        );
        
        if (profileError) throw profileError;
      }
      
      // Clear the cart
      await this.clearCart();
      
      return {
        success: true,
        orderId: order.id,
        message: 'Pedido realizado com sucesso!',
        pointsEarned: cart.summary.totalPoints
      };
    } catch (error) {
      console.error('Error during checkout:', error);
      return {
        success: false,
        message: 'Erro ao processar pedido',
        error: error.message
      };
    }
  },

  async addToFavorites(productId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          produto_id: productId
        });
      
      if (error) {
        // Check if it's a duplicate error
        if (error.code === '23505') {
          return {
            success: true,
            message: 'Produto já está nos favoritos'
          };
        }
        throw error;
      }
      
      return {
        success: true,
        message: 'Produto adicionado aos favoritos'
      };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return {
        success: false,
        message: 'Erro ao adicionar aos favoritos'
      };
    }
  },

  async removeFromFavorites(productId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('produto_id', productId);
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Produto removido dos favoritos'
      };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return {
        success: false,
        message: 'Erro ao remover dos favoritos'
      };
    }
  },
  
  async searchProducts(term: string): Promise<any[]> {
    try {
      if (!term || term.trim().length < 2) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          nome,
          preco,
          imagem_url,
          avaliacao,
          pontos,
          stores:loja_id (
            id,
            nome
          )
        `)
        .ilike('nome', `%${term.trim()}%`)
        .limit(10);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}
