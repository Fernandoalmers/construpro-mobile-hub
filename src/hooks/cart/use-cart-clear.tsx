
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook providing functionality to clear the entire cart
 * Following the same pattern as use-cart-remove for consistency
 */
export function useCartClear(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Clear entire cart - using the same direct approach as removeItem
  const clearCart = async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🧹 [useCartClear] Starting cart clear operation');
      
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

      if (cartError) {
        console.error('Error finding active cart:', cartError);
        throw cartError;
      }

      if (!cart) {
        console.log('🧹 [useCartClear] No active cart found, nothing to clear');
        // Still refresh to ensure UI is updated
        await refreshCartData();
        return;
      }
      
      console.log('🧹 [useCartClear] Clearing cart items for cart:', cart.id);
      
      // Delete all items from cart - single direct operation like removeItem
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
        
      if (error) {
        console.error('Error clearing cart items:', error);
        throw error;
      }

      console.log('✅ [useCartClear] Cart cleared successfully');
      
      // Immediately refresh cart data to update UI - same as removeItem
      console.log('🔄 [useCartClear] Refreshing cart data');
      await refreshCartData();
      
      console.log('✅ [useCartClear] Cart data refreshed');
      
    } catch (error: any) {
      console.error('❌ [useCartClear] Error clearing cart:', error);
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
