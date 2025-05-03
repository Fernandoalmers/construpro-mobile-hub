import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';

// Types for cart data
export type CartItem = {
  id: string;
  produto_id: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  produto?: {
    id: string;
    nome: string;
    preco: number;
    imagem_url: string;
    estoque: number;
    loja_id: string;
    pontos: number;
  };
};

export type Cart = {
  id: string;
  user_id: string;
  items: CartItem[];
  summary: {
    subtotal: number;
    shipping: number;
    totalItems: number;
    totalPoints: number;
  };
  stores?: {
    id: string;
    nome: string;
    logo_url: string;
  }[];
};

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
    } else {
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Get current cart
  const refreshCart = async (): Promise<void> => {
    if (!user) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (cartError) {
        if (cartError.code !== 'PGRST116') { // Not found error
          console.error('Error fetching cart:', cartError);
          toast.error('Erro ao carregar o carrinho');
        }
        setCart(null);
        setIsLoading(false);
        return;
      }

      if (!cartData) {
        setCart(null);
        setIsLoading(false);
        return;
      }

      // Fetch cart items
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id as produto_id,
          quantity as quantidade,
          price_at_add as preco,
          products:product_id (
            id,
            nome,
            preco,
            imagem_url,
            estoque,
            loja_id,
            pontos
          )
        `)
        .eq('cart_id', cartData.id);

      if (itemsError) {
        console.error('Error fetching cart items:', itemsError);
        setCart(null);
        setIsLoading(false);
        return;
      }

      // Calculate summary
      const items = cartItems.map((item: any) => ({
        ...item,
        produto: item.products,
        subtotal: item.quantidade * item.preco
      }));

      const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantidade * item.preco), 0);
      const totalItems = items.reduce((sum: number, item: any) => sum + item.quantidade, 0);
      const totalPoints = items.reduce((sum: number, item: any) => sum + ((item.produto?.pontos || 0) * item.quantidade), 0);
      const shipping = 15.90; // Fixed shipping for now

      // Get unique store information
      const storeIds = [...new Set(items.map((item: any) => item.produto?.loja_id).filter(Boolean))];
      
      let stores = [];
      if (storeIds.length > 0) {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', storeIds);
          
        stores = storesData || [];
      }

      const fullCart: Cart = {
        ...cartData,
        items,
        stores,
        summary: {
          subtotal,
          shipping,
          totalItems,
          totalPoints
        }
      };

      setCart(fullCart);
      setIsLoading(false);
      return;
    } catch (error) {
      console.error('Error in refreshCart:', error);
      toast.error('Erro ao atualizar o carrinho');
      setCart(null);
      setIsLoading(false);
      return;
    }
  };

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    if (!user) {
      toast.error('Faça login para adicionar produtos ao carrinho');
      return;
    }

    try {
      setIsLoading(true);

      // Get the product price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('preco, estoque')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        toast.error('Produto não encontrado');
        return;
      }

      if (product.estoque < quantity) {
        toast.error('Quantidade solicitada não disponível em estoque');
        return;
      }

      // Get or create a cart
      let cartId;
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (cartError && cartError.code !== 'PGRST116') { // Not "not found" error
        toast.error('Erro ao verificar o carrinho');
        return;
      }

      if (!existingCart) {
        // Create new cart
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert([{ user_id: user.id, status: 'active' }])
          .select('id')
          .single();

        if (createError || !newCart) {
          toast.error('Erro ao criar o carrinho');
          return;
        }
        
        cartId = newCart.id;
      } else {
        cartId = existingCart.id;

        // Check if product already exists in cart
        const { data: existingItem, error: existingItemError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cartId)
          .eq('product_id', productId)
          .single();

        if (!existingItemError && existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + quantity;
          
          if (product.estoque < newQuantity) {
            toast.error('Quantidade solicitada excede o estoque disponível');
            return;
          }
          
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', existingItem.id);

          if (updateError) {
            toast.error('Erro ao atualizar o carrinho');
            return;
          }
          
          await refreshCart();
          return;
        }
      }

      // Add new item to cart
      const { error: addError } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cartId,
          product_id: productId,
          quantity: quantity,
          price_at_add: product.preco
        }]);

      if (addError) {
        toast.error('Erro ao adicionar ao carrinho');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId: string, newQuantity: number): Promise<void> => {
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) {
        toast.error('Erro ao atualizar quantidade');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: string): Promise<void> => {
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        toast.error('Erro ao remover item do carrinho');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async (): Promise<void> => {
    if (!cart) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) {
        toast.error('Erro ao limpar o carrinho');
        return;
      }

      await refreshCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Erro ao limpar o carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total items in cart
  const cartCount = cart?.summary.totalItems || 0;

  const value = {
    cart,
    cartCount,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}
