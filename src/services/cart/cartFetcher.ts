
import { supabase } from "@/integrations/supabase/client";
import { getCart } from "./cartCore";

/**
 * Fetch user's cart
 */
export const fetchCart = async (userId: string) => {
  try {
    return await getCart();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
};

/**
 * Create a new cart for a user
 */
export const createCart = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('carts')
      .insert({ 
        user_id: userId,
        status: 'active'
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('Error creating cart:', error);
      return null;
    }
    
    return data.id;
  } catch (error) {
    console.error('Error in createCart:', error);
    return null;
  }
};
