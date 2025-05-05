
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { toast } from '@/components/ui/sonner';

/**
 * Fetches the current user's active cart with all items
 */
export async function fetchCart(userId: string): Promise<Cart | null> {
  try {
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
      return null;
    }

    if (!cartData) {
      return null;
    }

    // Fetch cart items - Corrigido para usar corretamente a tabela 'produtos'
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

    // Process items
    const items = cartItems.map((item: any) => ({
      id: item.id,
      produto_id: item.product_id,
      quantidade: item.quantity,
      preco: item.price_at_add,
      produto: {
        ...item.produtos,
        preco: item.produtos.preco_promocional || item.produtos.preco_normal,
        pontos: item.produtos.pontos_consumidor,
        loja_id: item.produtos.vendedor_id
      },
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
    const { data, error } = await supabase
      .from('carts')
      .insert([{ user_id: userId, status: 'active' }])
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
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: quantity })
      .eq('id', cartItemId);
      
    if (error) {
      console.error('Error updating cart item:', error);
      return false;
    }
    
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
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
      
    if (error) {
      console.error('Error removing cart item:', error);
      return false;
    }
    
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
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);
      
    if (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in clearCartItems:', error);
    return false;
  }
}

/**
 * Fetches product information
 */
export async function fetchProductInfo(productId: string) {
  try {
    console.log('Fetching product info for:', productId);
    
    const { data, error } = await supabase
      .from('produtos')  // Corrigido: agora usando a tabela 'produtos' em vez de 'products'
      .select('preco_normal, preco_promocional, estoque, pontos_consumidor')
      .eq('id', productId)
      .single();
      
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    // Retorna o objeto com os campos mapeados corretamente
    const productInfo = {
      preco: data.preco_promocional || data.preco_normal, // Usa o preço promocional se disponível, senão o preço normal
      estoque: data.estoque,
      pontos: data.pontos_consumidor
    };
    
    console.log('Product info retrieved:', productInfo);
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
    
    return data;
  } catch (error) {
    console.error('Error in findCartItem:', error);
    return null;
  }
}
