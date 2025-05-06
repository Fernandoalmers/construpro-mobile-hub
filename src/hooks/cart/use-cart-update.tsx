
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook providing functionality to update cart items
 */
export function useCartUpdate(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Update item quantity - ensure we catch any errors
  const updateQuantity = async (cartItemId: string, newQuantity: number): Promise<void> => {
    if (!cartItemId) {
      console.error('Invalid cart item ID provided to updateQuantity');
      throw new Error('ID do item no carrinho inválido');
    }
    
    try {
      setIsLoading(true);
      
      // Get item info to verify product stock
      const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select('product_id')
        .eq('id', cartItemId)
        .single();
        
      if (itemError || !item) {
        console.error('Error fetching cart item:', itemError);
        throw new Error('Item não encontrado');
      }
      
      // Check if product has enough stock
      const { data: product, error: productError } = await supabase
        .from('produtos')
        .select('estoque')
        .eq('id', item.product_id)
        .single();
        
      if (productError || !product) {
        throw new Error('Produto não encontrado');
      }
      
      if (product.estoque < newQuantity) {
        throw new Error('Quantidade solicitada não disponível em estoque');
      }
      
      // Update quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);
        
      if (updateError) {
        throw updateError;
      }
      
      await refreshCartData();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade: ' + (error.message || ''));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    updateQuantity
  };
}
