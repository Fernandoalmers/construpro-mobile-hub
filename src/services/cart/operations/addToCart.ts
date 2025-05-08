
import { supabase } from "@/integrations/supabase/client";
import { Cart } from "@/types/cart";
import { getCart } from "../cartFetcher";
import { ensureSingleActiveCart } from "../cartConsolidation";
import { checkProductStock, checkTotalStockAvailability } from "./stockChecker";
import { addOrUpdateCartItem } from "./cartItemModifiers";
import { toast } from "@/components/ui/sonner";

/**
 * Add item to cart
 */
export const addToCart = async (productId: string, quantity: number = 1): Promise<Cart | null> => {
  try {
    console.log('[addToCart] Adding to cart:', productId, 'quantity:', quantity);
    
    // Validate inputs
    if (!productId) {
      console.error('Invalid product ID');
      throw new Error('ID do produto inválido');
    }
    
    if (quantity <= 0) {
      console.error('Invalid quantity:', quantity);
      throw new Error('Quantidade inválida');
    }
    
    try {
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[addToCart] Authentication error:', authError);
        throw new Error('Erro de autenticação. Tente fazer login novamente.');
      }
      
      if (!userData.user) {
        console.error('[addToCart] User not authenticated');
        throw new Error('Usuário não autenticado');
      }

      console.log('[addToCart] IDs', { user_id: userData.user?.id, product_id: productId });

      // Check product stock
      const { hasStock, product, error: stockError } = await checkProductStock(productId, quantity);
      if (!hasStock) {
        throw stockError || new Error('Erro ao verificar estoque');
      }

      // Ensure we have a single active cart and get its ID
      const cartId = await ensureSingleActiveCart(userData.user.id);
      if (!cartId) {
        throw new Error('Não foi possível criar ou acessar o carrinho');
      }

      console.log('[addToCart] Using cart:', cartId);

      // Use the correct price field from the produtos table
      const productPrice = product.preco_promocional || product.preco_normal;
      console.log('[addToCart] Product price:', productPrice);
      
      // Add or update the cart item
      const { success, error: addError } = await addOrUpdateCartItem(cartId, productId, quantity, productPrice);
      if (!success) {
        console.error('[addToCart] Error adding/updating item:', addError);
        throw addError || new Error('Erro ao adicionar item ao carrinho');
      }

      // Return updated cart
      console.log('[addToCart] Item added/updated successfully, getting updated cart');
      const updatedCart = await getCart();
      
      return updatedCart;
    } catch (fetchError) {
      console.error('[addToCart] Fetch error:', fetchError);
      throw new Error('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
    }
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};
