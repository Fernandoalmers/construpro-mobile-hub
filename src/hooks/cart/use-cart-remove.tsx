
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook providing functionality to remove items from cart
 */
export function useCartRemove(refreshCartData: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // Remove item from cart - ensure we catch any errors
  const removeItem = async (cartItemId: string): Promise<void> => {
    if (!cartItemId) {
      console.error('Invalid cart item ID provided to removeItem');
      throw new Error('ID do item no carrinho inválido');
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
        
      if (error) {
        throw error;
      }

      await refreshCartData();
    } catch (error: any) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item: ' + (error.message || ''));
      // Re-throw the error to be handled by the caller
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    removeItem
  };
}
