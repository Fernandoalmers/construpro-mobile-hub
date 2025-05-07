
import { supabase } from "@/integrations/supabase/client";
import { checkProductStock } from "./stockChecker";
import { updateExistingCartItem } from "./cartItemModifiers";

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
  try {
    console.log('[updateCartItem] Updating cart item quantity:', itemId, quantity);
    
    if (!itemId) {
      console.error('Invalid item ID');
      throw new Error('ID do item inválido');
    }
    
    if (quantity <= 0) {
      console.error('Invalid quantity:', quantity);
      throw new Error('Quantidade inválida');
    }
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      throw new Error('Usuário não autenticado');
    }

    // Get item info to verify product stock
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select('product_id, cart_id')
      .eq('id', itemId)
      .single();
      
    if (itemError || !item) {
      console.error('Error fetching cart item:', itemError);
      throw new Error('Item não encontrado');
    }
    
    // Check if product has enough stock
    const { hasStock, error: stockError } = await checkProductStock(item.product_id, quantity);
    if (!hasStock) {
      throw stockError || new Error('Sem estoque suficiente');
    }

    // Update quantity with a reasonable cap
    const cappedQuantity = Math.min(quantity, 99);
    const { success, error } = await updateExistingCartItem(itemId, cappedQuantity);
    if (!success) {
      throw error || new Error('Erro ao atualizar quantidade');
    }

    return true;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};
