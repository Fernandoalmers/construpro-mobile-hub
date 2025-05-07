
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook providing functionality to add items to cart
 */
export function useCartAdd(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Add product to cart
  const addToCart = async (productId: string, quantity: number): Promise<void> => {
    console.log('[useCartAdd] adicionando', productId, 'qty:', quantity);
    
    if (!productId) {
      console.error('Invalid product ID provided to addToCart');
      throw new Error('ID do produto inválido');
    }
    
    setIsLoading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log('[useCartAdd] user authenticated:', userData.user.id);
      
      // Get or create active cart
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
        .single();

      if (cartError) {
        console.log('[useCartAdd] Error or no cart found:', cartError.code, cartError.message);
        
        if (cartError.code === 'PGRST116') {
          // No active cart found, create one
          console.log('[useCartAdd] Creating new cart for user');
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({
              user_id: userData.user.id,
              status: 'active'
            })
            .select('id')
            .single();

          if (createError) {
            console.error('[useCartAdd] Error creating cart:', createError);
            throw createError;
          }

          cartData = newCart;
          console.log('[useCartAdd] New cart created:', cartData.id);
        } else {
          throw cartError;
        }
      } else {
        console.log('[useCartAdd] Existing cart found:', cartData.id);
      }
      
      // Get product price 
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('preco_normal, preco_promocional, estoque')
        .eq('id', productId)
        .single();
        
      if (productError) {
        console.error('[useCartAdd] Error fetching product:', productError);
        throw productError;
      }
      
      console.log('[useCartAdd] Product data fetched:', product);
      
      // Check if there's enough stock
      if (product.estoque < quantity) {
        console.warn('[useCartAdd] Insufficient stock:', product.estoque, 'requested:', quantity);
        throw new Error(`Estoque insuficiente (disponível: ${product.estoque})`);
      }
      
      const price = product.preco_promocional || product.preco_normal;
      
      // MODIFIED: Always add as a new item without checking if it exists
      console.log('[useCartAdd] Adding new item to cart');
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartData.id,
          product_id: productId,
          quantity: quantity,
          price_at_add: price
        });
        
      if (insertError) {
        console.error('[useCartAdd] Error adding item:', insertError);
        throw insertError;
      }
      
      console.log('[useCartAdd] New item added to cart successfully');

      // Refresh cart data to update UI
      await refreshCartData();
      toast.success('Produto adicionado ao carrinho com sucesso');
      
    } catch (error: any) {
      console.error('[useCartAdd] erro ao adicionar ao carrinho', error);
      toast.error('Erro: ' + (error.message || 'Erro ao adicionar ao carrinho'));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    addToCart
  };
}
