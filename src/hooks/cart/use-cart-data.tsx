
import { useState, useEffect, useCallback } from 'react';
import { Cart } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';

export function useCartData(isAuthenticated: boolean, userId: string | null) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch cart data from the database
  const fetchCartData = useCallback(async (): Promise<Cart | null> => {
    try {
      if (!isAuthenticated || !userId) {
        console.log('Skipping cart fetch - user not authenticated');
        return null;
      }

      console.log('Fetching cart data for user:', userId);
      
      // Primeiro, verifica se existem múltiplos carrinhos ativos e consolida se necessário
      const { data: activeCarts, error: cartsError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (cartsError) {
        console.error('Error checking for active carts:', cartsError);
        throw new Error(`Error fetching carts: ${cartsError.message}`);
      }

      // Se encontrar múltiplos carrinhos ativos, manter apenas o mais recente
      if (activeCarts && activeCarts.length > 1) {
        console.warn(`Found ${activeCarts.length} active carts for user ${userId}, consolidating...`);
        
        // Buscar o carrinho mais recente
        const { data: latestCart, error: latestError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestError) {
          console.error('Error fetching latest cart:', latestError);
          throw new Error(`Error fetching latest cart: ${latestError.message}`);
        }

        // Marca os outros carrinhos como 'archived'
        if (latestCart) {
          const { error: updateError } = await supabase
            .from('carts')
            .update({ status: 'archived' })
            .eq('user_id', userId)
            .eq('status', 'active')
            .neq('id', latestCart.id);

          if (updateError) {
            console.error('Error archiving old carts:', updateError);
          } else {
            console.log(`Archived ${activeCarts.length - 1} old carts`);
          }
        }
      }

      // Agora buscar o carrinho ativo (que deve ser único)
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id, user_id, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cartError) {
        // Se não encontrar carrinho, criar um novo
        if (cartError.code === 'PGRST116') {
          console.log('No active cart found for user, creating new cart');
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({ user_id: userId, status: 'active' })
            .select('id, user_id, created_at')
            .single();

          if (createError) {
            console.error('Error creating new cart:', createError);
            throw new Error(`Error creating new cart: ${createError.message}`);
          }

          return fetchCartItems(newCart);
        } else {
          console.error('Error fetching cart:', cartError);
          throw new Error(`Error fetching cart: ${cartError.message}`);
        }
      }

      return fetchCartItems(cart);
    } catch (err: any) {
      console.error('Error in fetchCartData:', err);
      throw err;
    }
  }, [isAuthenticated, userId]);

  // Helper function to fetch cart items for a given cart
  const fetchCartItems = async (cart: any): Promise<Cart | null> => {
    if (!cart || !cart.id) {
      return null;
    }

    // Fetch cart items with product details
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantidade: quantity,
        preco: price_at_add,
        produto_id: product_id,
        produto:produtos(
          id,
          nome,
          preco:preco_normal,
          preco_promocional,
          imagem_url,
          estoque,
          loja_id:vendedor_id,
          pontos:pontos_consumidor
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      throw new Error(`Error fetching cart items: ${itemsError.message}`);
    }

    // Process cart items and calculate summary
    let subtotal = 0;
    let totalItems = 0;
    let totalPoints = 0;

    const processedItems = items?.map(item => {
      const produtoPreco = item.produto?.preco_promocional || item.produto?.preco || item.preco;
      const quantidade = item.quantidade || 0;
      const itemSubtotal = produtoPreco * quantidade;
      const pontos = (item.produto?.pontos || 0) * quantidade;
      
      subtotal += itemSubtotal;
      totalItems += quantidade;
      totalPoints += pontos;
      
      return {
        ...item,
        subtotal: itemSubtotal,
        pontos: pontos
      };
    }) || [];

    console.log('Cart data retrieved:', cart.id, `(${processedItems.length} items)`);

    return {
      id: cart.id,
      user_id: cart.user_id,
      items: processedItems,
      summary: {
        subtotal,
        shipping: subtotal > 0 ? 15.90 : 0, // Frete fixo ou grátis se carrinho vazio
        totalItems,
        totalPoints
      }
    };
  };

  // Function to refresh cart data
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setCart(null);
      setIsLoading(false);
      return;
    }
    
    console.log('Refreshing cart for user:', userId);
    setIsLoading(true);
    
    try {
      const cartData = await fetchCartData();
      setCart(cartData);
      setError(null);
    } catch (err: any) {
      console.error('Error refreshing cart:', err);
      setError(err);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, fetchCartData]);

  // Load cart data on mount and when auth state changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart, isAuthenticated, userId]);

  return {
    cart,
    isLoading,
    error,
    refreshCart
  };
}
