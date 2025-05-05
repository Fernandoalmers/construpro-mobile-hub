
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Adds an item to the cart
 */
export async function addItemToCart(
  cartId: string, 
  productId: string, 
  quantity: number,
  price: number
): Promise<boolean> {
  try {
    console.log('Adding item to cart:', { cartId, productId, quantity, price });
    
    // First, directly check if product exists in 'produtos' table
    const { data: productCheck, error: productCheckError } = await supabase
      .from('produtos')
      .select('id')
      .eq('id', productId)
      .maybeSingle();
      
    if (productCheckError) {
      console.error('Error checking product in produtos table:', productCheckError);
      return false;
    }
    
    if (!productCheck) {
      console.error('Product does not exist in produtos table');
      throw new Error('Produto não encontrado');
    }
    
    // Let's check if any cart_items exist for debugging
    const { data: existingItems, error: existingError } = await supabase
      .from('cart_items')
      .select('*')
      .limit(5);
      
    console.log('Example cart items:', existingItems);
    
    // Try to insert the new cart item
    const { error } = await supabase
      .from('cart_items')
      .insert([{
        cart_id: cartId,
        product_id: productId,
        quantity: quantity,
        price_at_add: price
      }]);

    if (error) {
      console.error('Error adding to cart:', error);
      
      // Special handling for foreign key errors
      if (error.code === '23503') {
        console.log('Foreign key violation - attempting to update schema');
        throw new Error("Erro de configuração da tabela cart_items. Por favor, contate o suporte.");
      }
      
      return false;
    }
    
    console.log('Item successfully added to cart');
    return true;
  } catch (error: any) {
    console.error('Error in addItemToCart:', error);
    throw error;
  }
}

/**
 * Updates the quantity of an item in the cart
 */
export async function updateItemQuantity(
  cartItemId: string, 
  quantity: number
): Promise<boolean> {
  try {
    console.log('Updating item quantity:', { cartItemId, quantity });
    
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: quantity })
      .eq('id', cartItemId);
      
    if (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
    
    console.log('Item quantity updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateItemQuantity:', error);
    return false;
  }
}

/**
 * Removes an item from the cart
 */
export async function removeCartItem(cartItemId: string): Promise<boolean> {
  try {
    console.log('Removing item from cart:', cartItemId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
      
    if (error) {
      console.error('Error removing cart item:', error);
      return false;
    }
    
    console.log('Item removed from cart successfully');
    return true;
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    return false;
  }
}

/**
 * Removes all items from a cart
 */
export async function clearCartItems(cartId: string): Promise<boolean> {
  try {
    console.log('Clearing all items from cart:', cartId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
      
    if (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
    
    console.log('Cart cleared successfully');
    return true;
  } catch (error) {
    console.error('Error in clearCartItems:', error);
    return false;
  }
}

/**
 * Finds a cart item by product ID
 */
export async function findCartItem(cartId: string, productId: string) {
  try {
    console.log('Finding cart item:', { cartId, productId });
    
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error finding cart item:', error);
      return null;
    }
    
    console.log('Cart item found:', data || 'No item found');
    return data;
  } catch (error) {
    console.error('Error in findCartItem:', error);
    return null;
  }
}
