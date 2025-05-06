
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook providing functionality to clear the entire cart
 */
export function useCartClear(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Clear entire cart - ensure we catch any errors
  const clearCart = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Get active cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (cartError || !cart) {
        console.error('Error finding active cart:', cartError);
        return;
      }
      
      // Delete all items from cart
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      if (error) {
        throw error;
      }

      await refreshCartData();
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error('Erro ao limpar o carrinho: ' + (error.message || ''));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    clearCart
  };
}
