
import { supabase } from '@/integrations/supabase/client';
import { Cart } from '@/types/cart';
import { calculateCartSummary } from './calculateCartSummary';

/**
 * Fetch and process cart items for a given cart
 */
export const processCartItems = async (cartId: string, userId: string): Promise<Cart> => {
  try {
    // Fetch the items for this cart
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantidade: quantity,
        preco: price_at_add,
        produto_id: product_id,
        produto:produtos(
          id,
          nome,
          preco:preco_normal,
          preco_promocional,
          imagens,
          estoque,
          loja_id:vendedor_id,
          pontos:pontos_consumidor
        )
      `)
      .eq('cart_id', cartId);

    if (itemsError) {
      console.error('[processCartItems] Error fetching cart items:', itemsError);
      // Return cart with empty items instead of throwing
      return createEmptyCartWithId(cartId, userId);
    }

    // Process items and create processed items array
    const processedItems = items?.map(processCartItem) || [];
    
    // Calculate summary based on the processed items
    const summary = calculateCartSummary(processedItems);

    console.log(`[processCartItems] Processed ${processedItems.length} cart items with total: ${summary.subtotal}`);
    
    return {
      id: cartId,
      user_id: userId,
      items: processedItems,
      summary
    };
  } catch (err) {
    console.error('[processCartItems] Error processing cart items:', err);
    // Return cart with empty items instead of throwing
    return createEmptyCartWithId(cartId, userId);
  }
};

/**
 * Process a single cart item 
 */
const processCartItem = (item: any) => {
  // Check if produto exists and is valid
  if (!item.produto || typeof item.produto !== 'object') {
    console.warn('[processCartItem] Invalid product data for cart item:', item.id);
    return {
      id: item.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade || 0,
      preco: item.preco || 0,
      subtotal: 0,
      produto: {
        id: item.produto_id,
        nome: 'Produto indisponível',
        preco: item.preco || 0,
        imagem_url: '',
        estoque: 0,
        loja_id: '',
        pontos: 0
      }
    };
  }
  
  const preco = item.produto.preco_promocional || item.produto.preco || item.preco;
  const quantidade = item.quantidade || 0;
  const itemSubtotal = preco * quantidade;
  const pontos = (item.produto.pontos || 0) * quantidade;
  
  // Extract image URL from imagens array if available
  let imageUrl = '';
  try {
    if (item.produto.imagens && Array.isArray(item.produto.imagens) && item.produto.imagens.length > 0) {
      // Convert the image value to string explicitly to fix the type error
      imageUrl = String(item.produto.imagens[0]);
    }
  } catch (imageErr) {
    console.error('[processCartItem] Error processing image URL:', imageErr);
  }
  
  return {
    id: item.id,
    produto_id: item.produto_id,
    quantidade: quantidade,
    preco: preco,
    subtotal: itemSubtotal,
    produto: {
      id: item.produto.id,
      nome: item.produto.nome || 'Produto sem nome',
      preco,
      imagem_url: imageUrl,
      estoque: item.produto.estoque || 0,
      loja_id: item.produto.loja_id || '',
      pontos: item.produto.pontos || 0
    }
  };
};

/**
 * Create an empty cart with a specific ID
 */
const createEmptyCartWithId = (cartId: string, userId: string): Cart => {
  return {
    id: cartId,
    user_id: userId,
    items: [],
    summary: {
      subtotal: 0,
      shipping: 0,
      totalItems: 0,
      totalPoints: 0
    }
  };
};
