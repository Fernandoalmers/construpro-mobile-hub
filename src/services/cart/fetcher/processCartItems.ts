
import { supabase } from '@/integrations/supabase/client';
import { Cart, CartItem } from '@/types/cart';
import { calculateCartSummary } from './calculateCartSummary';
import { getProductPoints } from '@/utils/pointsCalculations';

/**
 * Process cart items and calculate summary - OPTIMIZED VERSION
 */
export async function processCartItems(
  cartId: string, 
  userId: string,
  userType: 'consumidor' | 'profissional' | 'lojista' | 'vendedor' = 'consumidor'
): Promise<Cart> {
  console.log('[processCartItems] Processing cart items for cart:', cartId, 'user type:', userType);
  
  try {
    // Step 1: Fetch cart items first (lighter query)
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity, price_at_add, created_at, updated_at')
      .eq('cart_id', cartId);

    if (itemsError) {
      console.error('[processCartItems] Error fetching cart items:', itemsError);
      throw itemsError;
    }

    if (!items || items.length === 0) {
      console.log('[processCartItems] No items found in cart');
      return {
        id: cartId,
        user_id: userId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
        summary: {
          subtotal: 0,
          totalItems: 0,
          totalPoints: 0
        }
      };
    }

    // Step 2: Fetch product data for all items in batch
    const productIds = items.map(item => item.product_id);
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        preco_normal,
        preco_promocional,
        pontos_profissional,
        pontos_consumidor,
        estoque,
        categoria,
        segmento,
        status,
        vendedor_id,
        imagens,
        promocao_ativa,
        promocao_inicio,
        promocao_fim
      `)
      .in('id', productIds);

    if (produtosError) {
      console.error('[processCartItems] Error fetching products:', produtosError);
      throw produtosError;
    }

    // Step 3: Create a map for quick product lookup
    const productMap = new Map();
    produtos?.forEach(produto => {
      productMap.set(produto.id, produto);
    });

    // Step 4: Transform the data to match our CartItem interface
    const cartItems: CartItem[] = items.map(item => {
      const produto = productMap.get(item.product_id);
      
      if (!produto) {
        console.warn('[processCartItems] Product not found for item:', item.product_id);
        return null;
      }

      // Safely handle imagens field with proper type checking
      let imageUrl = null;
      let imagensArray: string[] = [];
      
      if (produto.imagens) {
        if (Array.isArray(produto.imagens)) {
          imagensArray = produto.imagens as string[];
          imageUrl = imagensArray.length > 0 ? imagensArray[0] : null;
        } else if (typeof produto.imagens === 'string') {
          try {
            const parsed = JSON.parse(produto.imagens);
            if (Array.isArray(parsed)) {
              imagensArray = parsed;
              imageUrl = imagensArray.length > 0 ? imagensArray[0] : null;
            }
          } catch (e) {
            console.warn('[processCartItems] Failed to parse imagens JSON:', e);
            imagensArray = [];
            imageUrl = null;
          }
        }
      }

      // Calculate correct points for this user type
      const pointsForUserType = getProductPoints(produto, userType);
      const subtotal = item.price_at_add * item.quantity;

      return {
        id: item.id,
        user_id: userId, // Add the missing user_id property
        produto_id: item.product_id,
        quantidade: item.quantity,
        preco: item.price_at_add,
        subtotal: subtotal, // Add the missing subtotal property
        created_at: item.created_at,
        updated_at: item.updated_at,
        produto: {
          id: produto.id,
          nome: produto.nome,
          preco: produto.preco_promocional || produto.preco_normal,
          preco_normal: produto.preco_normal,
          preco_promocional: produto.preco_promocional,
          imagem_url: imageUrl || '',
          imagens: imagensArray,
          pontos: pointsForUserType,
          pontos_profissional: produto.pontos_profissional,
          pontos_consumidor: produto.pontos_consumidor,
          estoque: produto.estoque,
          categoria: produto.categoria,
          segmento: produto.segmento,
          loja_id: produto.vendedor_id,
          status: produto.status,
          promocao_ativa: produto.promocao_ativa,
          promocao_inicio: produto.promocao_inicio,
          promocao_fim: produto.promocao_fim
        }
      };
    }).filter(Boolean) as CartItem[]; // Remove null items

    // Calculate summary with user type (no shipping)
    const summary = calculateCartSummary(cartItems, userType);

    const cart: Cart = {
      id: cartId,
      user_id: userId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: cartItems,
      summary
    };

    console.log('[processCartItems] Cart processed successfully:', {
      itemCount: cartItems.length,
      totalPoints: summary.totalPoints,
      userType,
      processingTime: 'optimized'
    });

    return cart;
  } catch (error) {
    console.error('[processCartItems] Error processing cart items:', error);
    throw error;
  }
}
