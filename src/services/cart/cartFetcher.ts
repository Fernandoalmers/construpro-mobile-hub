
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';
import { getFirstImage } from './utils';

/**
 * Fetches the current user's active cart with all items
 */
export async function fetchCart(userId: string): Promise<Cart | null> {
  try {
    console.log('Fetching cart for user:', userId);
    
    // Get the most recent active cart
    const { data: cartsData, error: cartsError } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (cartsError) {
      console.error('Error fetching carts:', cartsError);
      return null;
    }

    if (!cartsData || cartsData.length === 0) {
      console.log('No active carts found for user');
      return null;
    }

    // Use the most recently created cart
    const cartData = cartsData[0];
    console.log('Found active cart:', cartData.id);

    // Fetch cart items with product details
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
          imagens,
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

    // If there are multiple active carts, consolidate them (cleanup)
    if (cartsData.length > 1) {
      console.log('Multiple active carts found, will use the most recent one:', cartData.id);
    }

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
        loja_id: item.produtos.vendedor_id,
        imagem_url: getFirstImage(item.produtos.imagens)
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
