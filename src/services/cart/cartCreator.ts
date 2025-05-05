
import { supabase } from '@/integrations/supabase/client';

/**
 * Creates a new cart for the user
 */
export async function createCart(userId: string): Promise<string | null> {
  try {
    console.log('Creating new cart for user:', userId);
    
    const { data, error } = await supabase
      .from('carts')
      .insert([{ user_id: userId, status: 'active' }])
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating cart:', error);
      return null;
    }
    
    console.log('New cart created:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in createCart:', error);
    return null;
  }
}
