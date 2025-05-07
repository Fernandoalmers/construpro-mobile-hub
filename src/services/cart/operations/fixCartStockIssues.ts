
import { supabase } from "@/integrations/supabase/client";
import { validateCartItemsStock } from "./stockChecker";
import { updateExistingCartItem, removeCartItem } from "./cartItemModifiers";
import { toast } from "@/components/ui/sonner";

/**
 * Fix cart items with stock issues
 * This will adjust quantities or remove items that exceed available stock
 */
export const fixCartStockIssues = async (): Promise<boolean> => {
  try {
    console.log('[fixCartStockIssues] Fixing cart stock issues');
    
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }
    
    // Get active cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .maybeSingle();
      
    if (cartError || !cart) {
      console.error('Error finding active cart:', cartError);
      return false;
    }
    
    // Validate cart items
    const { invalidItems } = await validateCartItemsStock(cart.id);
    
    if (invalidItems.length === 0) {
      console.log('No stock issues found');
      return true;
    }
    
    console.log(`Found ${invalidItems.length} items with stock issues, fixing...`);
    
    // Fix each invalid item
    for (const item of invalidItems) {
      if (item.availableStock > 0) {
        // Update to available stock
        console.log(`Adjusting item ${item.id} quantity from ${item.quantity} to ${item.availableStock}`);
        await updateExistingCartItem(item.id, item.availableStock);
        toast.warning(`Quantidade de um item ajustada devido à disponibilidade de estoque`);
      } else {
        // Remove item if no stock
        console.log(`Removing item ${item.id} due to no stock`);
        await removeCartItem(item.id);
        toast.error(`Um item foi removido do carrinho por não ter estoque disponível`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing cart stock issues:', error);
    return false;
  }
};
