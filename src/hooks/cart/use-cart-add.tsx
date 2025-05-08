
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
      
      // Get product price and stock
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
      
      // Check if item already exists in cart
      const { data: existingItem, error: findError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartData.id)
        .eq('product_id', productId)
        .maybeSingle();
        
      if (findError && findError.code !== 'PGRST116') {
        console.error('[useCartAdd] Error checking for existing item:', findError);
        throw findError;
      }
      
      if (existingItem) {
        // Update existing item by ADDING the new quantity
        const newQuantity = existingItem.quantity + quantity;
        
        // Check if new quantity exceeds stock
        if (newQuantity > product.estoque) {
          console.warn('[useCartAdd] Total quantity exceeds stock:', product.estoque, 'requested total:', newQuantity);
          throw new Error(`Quantidade total excederia o estoque disponível (${product.estoque})`);
        }
        
        console.log('[useCartAdd] Item exists, updating quantity from', existingItem.quantity, 'to', newQuantity);
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);
          
        if (updateError) {
          console.error('[useCartAdd] Error updating item:', updateError);
          throw updateError;
        }
        
        console.log('[useCartAdd] Existing item quantity updated successfully');
        toast.success(`Quantidade atualizada para ${newQuantity}`);
      } else {
        // Add new item
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
        toast.success('Produto adicionado ao carrinho com sucesso');
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
