
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
      
      // Get or create active cart
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
        .single();

      if (cartError) {
        if (cartError.code === 'PGRST116') {
          // No active cart found, create one
          const { data: newCart, error: createError } = await supabase
            .from('carts')
            .insert({
              user_id: userData.user.id,
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
      
      // Check if there's enough stock
      if (product.estoque < quantity) {
        throw new Error('Estoque insuficiente');
      }
      
      const price = product.preco_promocional || product.preco_normal;
      
      // Check if product exists in cart
      const { data: existingItem, error: existingItemError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartData.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (existingItem) {
        // Check if new quantity exceeds stock
        if (existingItem.quantity + quantity > product.estoque) {
          throw new Error('A quantidade total excede o estoque disponível');
        }
        
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
        const { error: insertError } = await supabase
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
      }

      // Refresh cart data to update UI
      await refreshCartData();
      
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
