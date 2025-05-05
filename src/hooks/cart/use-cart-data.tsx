
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { Cart } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';

export function useCartData(isAuthenticated: boolean, userId: string | null) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch cart data from Supabase
  const fetchCartData = useCallback(async () => {
    if (!userId) return null;
    
    try {
      console.log('Fetching cart data for user:', userId);
      
      // Get active cart
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (cartError || !cartData) {
        console.log('No active cart found');
        return null;
      }
      
      // Fetch cart items with product details
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          price_at_add,
          product_id,
          produtos:product_id (
            id,
            nome,
            preco_normal,
            preco_promocional,
            imagem_url,
            estoque,
            vendedor_id,
            imagens
          )
        `)
        .eq('cart_id', cartData.id);
      
      if (itemsError) {
        console.error('Error fetching cart items:', itemsError);
        return null;
      }
      
      // Get store information for products
      const vendorIds = [...new Set(cartItems
        .map(item => item.produtos?.vendedor_id)
        .filter(Boolean))];
      
      let stores = [];
      if (vendorIds.length > 0) {
        const { data: storesData, error: storesError } = await supabase
          .from('vendedores')
          .select('id, nome_loja')
          .in('id', vendorIds);
          
        if (!storesError) {
          stores = storesData.map(store => ({
            id: store.id,
            nome: store.nome_loja,
            logo_url: null
          }));
        }
      }
      
      // Format the cart items
      const formattedItems = cartItems.map(item => {
        const preco = item.price_at_add;
        const quantidade = item.quantity;
        const subtotal = preco * quantidade;
        
        const produto = item.produtos ? {
          id: item.produtos.id,
          nome: item.produtos.nome,
          preco: item.produtos.preco_promocional || item.produtos.preco_normal,
          imagem_url: item.produtos.imagem_url || (item.produtos.imagens && item.produtos.imagens.length > 0 ? item.produtos.imagens[0] : null),
          estoque: item.produtos.estoque,
          loja_id: item.produtos.vendedor_id,
          pontos: 0
        } : null;
        
        return {
          id: item.id,
          produto_id: item.product_id,
          quantidade,
          preco,
          subtotal,
          produto
        };
      });
      
      // Calculate cart summary
      const subtotal = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalItems = formattedItems.reduce((sum, item) => sum + item.quantidade, 0);
      const shipping = 15.90 * (stores.length || 1); // Shipping cost per store
      
      return {
        id: cartData.id,
        user_id: userId,
        items: formattedItems,
        summary: {
          subtotal,
          shipping,
          totalItems,
          totalPoints: 0
        },
        stores
      };
    } catch (error) {
      console.error('Error in fetchCartData:', error);
      return null;
    }
  }, [userId]);

  // Function to refresh cart data
  const refreshCart = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !userId) {
      console.log('Cannot refresh cart: user not authenticated or missing ID');
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Refreshing cart for user:', userId);
      setIsLoading(true);
      
      const cartData = await fetchCartData();
      
      console.log('Cart data retrieved:', cartData);
      setCart(cartData);
      
      // Save minimal cart info to localStorage
      if (cartData) {
        try {
          localStorage.setItem('cartData', JSON.stringify({
            id: cartData.id,
            summary: cartData.summary
          }));
        } catch (err) {
          console.warn('Could not save cart to localStorage:', err);
        }
      }
    } catch (error) {
      console.error('Error in refreshCart:', error);
      toast.error('Erro ao atualizar o carrinho');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, fetchCartData]);

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      console.log('User authenticated, refreshing cart');
      refreshCart();
    } else {
      console.log('User not authenticated, clearing cart');
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, refreshCart]);

  return {
    cart,
    isLoading,
    refreshCart,
    setIsLoading
  };
}
