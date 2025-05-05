
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';

/**
 * Service for managing cart functionality
 */
export const cartService = {
  /**
   * Checks if a product is in the user's favorites
   */
  async isProductFavorited(productId: string): Promise<boolean> {
    try {
      console.log('Checking if product is favorited:', productId);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        return false;
      }
      
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('produto_id', productId)
        .eq('user_id', userData.user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking favorite status:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error in isProductFavorited:', error);
      return false;
    }
  },
  
  /**
   * Adds or removes a product from favorites
   */
  async toggleFavorite(productId: string): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }
      
      // Check if product is already favorited
      const isFavorited = await this.isProductFavorited(productId);
      
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('produto_id', productId)
          .eq('user_id', userData.user.id);
          
        if (error) throw error;
        return false; // No longer favorited
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            produto_id: productId,
            user_id: userData.user.id
          });
          
        if (error) throw error;
        return true; // Now favorited
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }
};

// Re-export CartItem and Cart types
export type { Cart, CartItem };
