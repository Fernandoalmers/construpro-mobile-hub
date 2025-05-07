
import { CartItem } from '@/types/cart';

export const useGroupItemsByStore = (
  cartItems: CartItem[],
  storeInfo: Record<string, any>
) => {
  // Group items by store with improved data handling
  const itemsByStore = cartItems.reduce((groups: Record<string, { loja: any, items: CartItem[] }>, item) => {
    // Safety check for item and product
    if (!item || !item.produto) {
      console.warn("CartScreen: Skipping invalid item:", item);
      return groups;
    }
    
    const storeId = item.produto.loja_id;
    
    // Skip items without store ID
    if (!storeId) {
      console.warn("CartScreen: Item missing loja_id:", item);
      return groups;
    }
    
    // Create or update store group
    if (!groups[storeId]) {
      // Get store info from our fetched storeInfo object
      const store = storeInfo[storeId] || { 
        id: storeId, 
        nome: `Loja ${storeId.substring(0, 4)}`,
        logo_url: null 
      };
      
      groups[storeId] = {
        loja: store,
        items: []
      };
    }
    
    // Add item to store group
    groups[storeId].items.push(item);
    return groups;
  }, {});
  
  return itemsByStore;
};
