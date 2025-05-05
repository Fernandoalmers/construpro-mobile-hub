
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches the current user's active cart with all items
 */
export async function fetchCart(userId: string): Promise<Cart | null> {
  try {
    console.log('Fetching cart for user:', userId);
    
    // Get cart
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (cartError) {
      if (cartError.code !== 'PGRST116') { // Not found error
        console.error('Error fetching cart:', cartError);
        return null;
      }
      console.log('No active cart found for user');
      return null;
    }

    if (!cartData) {
      console.log('No cart data returned');
      return null;
    }

    console.log('Found cart:', cartData);

    // Fetch cart items with product details from 'produtos' table
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        price_at_add,
        produtos:product_id (
          id,
          nome,
          preco_normal,
          preco_promocional,
          imagem_url,
          estoque,
          vendedor_id,
          pontos_consumidor
        )
      `)
      .eq('cart_id', cartData.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return null;
    }

    console.log('Retrieved cart items:', cartItems);

    // Process items
    const items = cartItems.map((item: any) => ({
      id: item.id,
      produto_id: item.product_id,
      quantidade: item.quantity,
      preco: item.price_at_add,
      produto: item.produtos ? {
        ...item.produtos,
        preco: item.produtos.preco_promocional || item.produtos.preco_normal,
        pontos: item.produtos.pontos_consumidor,
        loja_id: item.produtos.vendedor_id
      } : null,
      subtotal: item.quantity * item.price_at_add
    }));

    // Calculate summary
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantidade * item.preco), 0);
    const totalItems = items.reduce((sum: number, item: any) => sum + item.quantidade, 0);
    const totalPoints = items.reduce((sum: number, item: any) => sum + ((item.produto?.pontos || 0) * item.quantidade), 0);
    
    // Get store information
    const storeIds = [...new Set(items.map((item: any) => item.produto?.loja_id).filter(Boolean))];
    const shipping = 15.90; // Fixed shipping for now
    
    let stores = [];
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, nome, logo_url')
        .in('id', storeIds);
        
      stores = storesData || [];
    }

    console.log('Processed cart data:', {
      items: items.length,
      subtotal,
      totalItems,
      totalPoints,
      stores: stores.length
    });

    return {
      ...cartData,
      items,
      stores,
      summary: {
        subtotal,
        shipping,
        totalItems,
        totalPoints
      }
    };
  } catch (error) {
    console.error('Error in fetchCart:', error);
    return null;
  }
}

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
    
    // First, check if product exists in 'produtos' table
    const { data: productCheck, error: productCheckError } = await supabase
      .from('produtos')
      .select('id')
      .eq('id', productId)
      .single();
      
    if (productCheckError || !productCheck) {
      console.error('Product does not exist in produtos table:', productCheckError || 'No product found');
      return false;
    }
    
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
      return false;
    }
    
    console.log('Item successfully added to cart');
    return true;
  } catch (error) {
    console.error('Error in addItemToCart:', error);
    return false;
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
 * Fetches product information from the 'produtos' table
 */
export async function fetchProductInfo(productId: string) {
  try {
    console.log('Fetching product info for:', productId);
    
    // Use 'produtos' table
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_normal, preco_promocional, estoque, pontos_consumidor, vendedor_id')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    if (!data) {
      console.error('Product not found:', productId);
      return null;
    }
    
    console.log('Product data retrieved:', data);
    
    // Map the fields correctly
    const productInfo = {
      id: data.id,
      nome: data.nome,
      preco: data.preco_promocional || data.preco_normal,
      estoque: data.estoque,
      pontos: data.pontos_consumidor,
      vendedor_id: data.vendedor_id
    };
    
    console.log('Product info processed:', productInfo);
    return productInfo;
  } catch (error) {
    console.error('Error in fetchProductInfo:', error);
    return null;
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
