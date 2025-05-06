
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { Cart } from '@/types/cart';
import { supabase } from '@/integrations/supabase/client';
import { productFetcher } from '@/services/cart/productFetcher';

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
      
      if (cartError) {
        console.error('Error fetching cart:', cartError);
        return null;
      }
      
      if (!cartData) {
        console.log('No active cart found, user may need to add items first');
        return {
          id: null,
          user_id: userId,
          items: [],
          summary: {
            subtotal: 0,
            shipping: 0,
            totalItems: 0,
            totalPoints: 0
          },
          stores: []
        };
      }
      
      console.log('Found active cart:', cartData.id);
      
      // Fetch cart items with product details
      const { data: cartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          price_at_add,
          product_id
        `)
        .eq('cart_id', cartData.id);
      
      if (itemsError) {
        console.error('Error fetching cart items:', itemsError);
        throw itemsError;
      }
      
      console.log(`Fetched ${cartItems?.length || 0} cart items`);
      
      if (!cartItems || cartItems.length === 0) {
        return {
          id: cartData.id,
          user_id: userId,
          items: [],
          summary: {
            subtotal: 0,
            shipping: 0,
            totalItems: 0,
            totalPoints: 0
          },
          stores: []
        };
      }
      
      // For each cart item, fetch the product details separately
      const productDetailsPromises = cartItems.map(async (item) => {
        try {
          const productInfo = await productFetcher.fetchProductInfo(item.product_id);
          return {
            cartItemId: item.id,
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price_at_add,
            product: productInfo
          };
        } catch (err) {
          console.error(`Error fetching product info for ${item.product_id}:`, err);
          return {
            cartItemId: item.id,
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price_at_add,
            product: null
          };
        }
      });
      
      const itemsWithDetails = await Promise.all(productDetailsPromises);
      
      console.log('Processed items with details:', itemsWithDetails.length);
      
      // Get store information for products
      const vendorIds = [...new Set(itemsWithDetails
        .map(item => item.product?.vendedor_id)
        .filter(Boolean))];
      
      let stores = [];
      if (vendorIds.length > 0) {
        const { data: storesData, error: storesError } = await supabase
          .from('vendedores')
          .select('id, nome_loja')
          .in('id', vendorIds);
          
        if (storesError) {
          console.error('Error fetching stores:', storesError);
        } else if (storesData) {
          stores = storesData.map(store => ({
            id: store.id,
            nome: store.nome_loja,
            logo_url: null
          }));
          console.log(`Fetched ${stores.length} stores`);
        }
      }
      
      // Format the cart items
      const formattedItems = itemsWithDetails
        .filter(item => item.product) // Filter out items where product fetch failed
        .map(item => {
          const preco = item.price;
          const quantidade = item.quantity;
          const subtotal = preco * quantidade;
          
          let imagem_url = null;
          if (item.product?.imagens && Array.isArray(item.product.imagens) && item.product.imagens.length > 0) {
            imagem_url = String(item.product.imagens[0]);
          }
          
          return {
            id: item.cartItemId,
            produto_id: item.productId,
            quantidade,
            preco,
            subtotal,
            produto: item.product ? {
              id: item.product.id,
              nome: item.product.nome,
              preco: item.product.preco_normal || item.product.preco_promocional,
              imagem_url: imagem_url,
              imagens: item.product.imagens,
              estoque: item.product.estoque,
              loja_id: item.product.vendedor_id,
              pontos: item.product.pontos_consumidor || 0
            } : null
          };
        });
      
      // Calculate cart summary
      const subtotal = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalItems = formattedItems.reduce((sum, item) => sum + item.quantidade, 0);
      const shipping = 15.90 * (stores.length || 1); // Shipping cost per store
      const totalPoints = formattedItems.reduce((sum, item) => 
        sum + ((item.produto?.pontos || 0) * item.quantidade), 0);
      
      console.log('Cart summary calculated:', { subtotal, totalItems, shipping, totalPoints });
      
      return {
        id: cartData.id,
        user_id: userId,
        items: formattedItems,
        summary: {
          subtotal,
          shipping,
          totalItems,
          totalPoints
        },
        stores
      };
    } catch (error) {
      console.error('Error in fetchCartData:', error);
      toast.error('Erro ao buscar dados do carrinho');
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
      
      console.log('Cart data retrieved:', cartData?.id);
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
