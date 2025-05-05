
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from './use-cart';
import { supabase } from '@/integrations/supabase/client';

export function useCartActions() {
  const { refreshCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState<Record<string, boolean>>({});
  const [isBuyingNow, setIsBuyingNow] = useState<Record<string, boolean>>({});
  
  // Use timeouts to ensure loading states don't get stuck
  const loadingTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Helper to ensure loading states get cleared after timeout
  const setLoadingWithTimeout = (
    stateUpdater: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    productId: string, 
    isLoading: boolean, 
    timeoutMs: number = 10000
  ) => {
    // Clear any existing timeout for this product
    if (loadingTimeoutsRef.current[productId]) {
      clearTimeout(loadingTimeoutsRef.current[productId]);
      delete loadingTimeoutsRef.current[productId];
    }
    
    // Update loading state
    stateUpdater(prev => ({ ...prev, [productId]: isLoading }));
    
    // Set a timeout to clear loading state if it gets stuck
    if (isLoading) {
      loadingTimeoutsRef.current[productId] = setTimeout(() => {
        console.log(`[useCartActions] Loading timeout triggered for ${productId}`);
        stateUpdater(prev => ({ ...prev, [productId]: false }));
        delete loadingTimeoutsRef.current[productId];
      }, timeoutMs);
    }
  };

  // Add to cart function - properly handles authentication and updates state
  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!productId) {
      console.error('[useCartActions] Invalid product ID:', productId);
      toast.error('Erro: ID do produto inválido');
      return false;
    }

    console.log('[useCartActions] handleAddToCart called with:', { productId, quantity });
    
    // Check authentication first before setting loading state
    if (!isAuthenticated || !user) {
      console.log('[useCartActions] User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${productId}` } });
      return false;
    }

    // Set loading state at the beginning with a timeout
    setLoadingWithTimeout(setIsAddingToCart, productId, true);
    
    try {
      console.log('[useCartActions] User authenticated, adding to cart:', { userId: user.id, productId, quantity });
      
      // Get or create active cart
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (cartError) {
        if (cartError.code === 'PGRST116') {
          // No active cart found, create one
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({
              user_id: user.id,
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
      
      // Get product price 
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('preco_normal, preco_promocional, estoque')
        .eq('id', productId)
        .single();
        
      if (productError) {
        throw productError;
      }
      
      const price = product.preco_promocional || product.preco_normal;
      
      // Check if product exists in cart
      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartData.id)
        .eq('product_id', productId)
        .maybeSingle();
      
      // Debug logs
      console.log('[useCartActions] Cart ID:', cartData.id);
      console.log('[useCartActions] Product:', product);
      console.log('[useCartActions] Existing item:', existingItem);
        
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
        const { data: insertData, error: insertError } = await supabase
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
        
        console.log('[useCartActions] New item inserted:', insertData);
      }
      
      // Double-check insertion by directly querying
      const { data: checkData, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartData.id)
        .eq('product_id', productId);
        
      console.log('[useCartActions] Verification check:', { data: checkData, error: checkError });
      
      // Refresh cart to make sure the UI updates
      console.log('[useCartActions] Product added to cart, refreshing cart data');
      await refreshCart();
      
      toast.success(`${quantity} unidade(s) adicionada(s) ao carrinho`);
      return true;
    } catch (error: any) {
      console.error('[useCartActions] Error adding to cart:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      return false;
    } finally {
      // Always reset loading state, even on error
      console.log('[useCartActions] Resetting loading state for productId:', productId);
      setLoadingWithTimeout(setIsAddingToCart, productId, false);
    }
  };

  // Buy now function - adds to cart then immediately navigates to cart
  const handleBuyNow = async (productId: string, quantity: number = 1) => {
    if (!productId) {
      console.error('[useCartActions] Invalid product ID:', productId);
      toast.error('Erro: ID do produto inválido');
      return false;
    }

    console.log('[useCartActions] handleBuyNow called with:', { productId, quantity });
    
    // Check authentication first before setting loading state
    if (!isAuthenticated || !user) {
      console.log('[useCartActions] User not authenticated, redirecting to login');
      navigate('/login', { state: { from: `/produto/${productId}` } });
      return false;
    }

    // Set buying state with a timeout
    setLoadingWithTimeout(setIsBuyingNow, productId, true);
    
    try {
      console.log('[useCartActions] Adding to cart with:', { productId, quantity });
      
      // Add to cart first
      const success = await handleAddToCart(productId, quantity);
      
      if (success) {
        console.log('[useCartActions] Successfully added to cart, navigating to /cart');
        // Navigate to cart page
        navigate('/cart');
        return true;
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error: any) {
      console.error('[useCartActions] Error buying now:', error);
      toast.error('Erro: ' + (error.message || 'Erro ao processar compra'));
      return false;
    } finally {
      // Always reset buying state, even on error
      console.log('[useCartActions] Resetting buying state for productId:', productId);
      setLoadingWithTimeout(setIsBuyingNow, productId, false);
    }
  };

  // Clean up timeouts when component unmounts
  const clearAllTimeouts = useCallback(() => {
    Object.values(loadingTimeoutsRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    loadingTimeoutsRef.current = {};
  }, []);

  return {
    handleAddToCart,
    handleBuyNow,
    isAddingToCart,
    isBuyingNow,
    clearAllTimeouts
  };
}
