
import { useState, useEffect, useCallback } from 'react';
import { Cart } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';
import { ensureSingleActiveCart } from '@/services/cart/cartConsolidation';

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
      
      // Ensure there is only one active cart for this user
      const activeCartId = await ensureSingleActiveCart(userId);
      
      if (!activeCartId) {
        console.log('No active cart found or created for user');
        return {
          id: '',
          user_id: userId,
          items: [],
          summary: {
            subtotal: 0,
            shipping: 0,
            totalItems: 0,
            totalPoints: 0
          }
        };
      }

      // Fetch cart with the guaranteed single active cart ID
      const { data: cart } = await supabase
        .from('carts')
        .select('id, user_id, created_at')
        .eq('id', activeCartId)
        .single();

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

    // Fetch cart items with product details - fixed query to avoid the imagem_url error
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
          imagens,
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
      if (!item.produto || item.produto.error) {
        console.warn('Invalid product data for cart item:', item.id);
        return {
          id: item.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade || 0,
          preco: item.preco || 0,
          subtotal: 0,
          pontos: 0,
          produto: {
            id: item.produto_id,
            nome: 'Produto indisponível',
            preco: item.preco || 0,
            imagem_url: '',
            estoque: 0,
            loja_id: '',
            pontos: 0
          }
        };
      }

      const produtoPreco = item.produto.preco_promocional || item.produto.preco || item.preco;
      const quantidade = item.quantidade || 0;
      const itemSubtotal = produtoPreco * quantidade;
      const pontos = (item.produto.pontos || 0) * quantidade;
      
      subtotal += itemSubtotal;
      totalItems += quantidade;
      totalPoints += pontos;
      
      // Extract image URL from imagens array if available
      let imageUrl = '';
      if (item.produto.imagens && Array.isArray(item.produto.imagens) && item.produto.imagens.length > 0) {
        imageUrl = item.produto.imagens[0];
      }

      return {
        id: item.id,
        produto_id: item.produto_id,
        quantidade: quantidade,
        preco: produtoPreco,
        subtotal: itemSubtotal,
        pontos,
        produto: {
          id: item.produto.id,
          nome: item.produto.nome || 'Produto sem nome',
          preco: produtoPreco,
          imagem_url: imageUrl,
          estoque: item.produto.estoque || 0,
          loja_id: item.produto.loja_id || '',
          pontos: item.produto.pontos || 0
        }
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
