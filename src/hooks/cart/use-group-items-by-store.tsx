
import { CartItem } from '@/types/cart';

// Export this function to fix the import issue in useCheckout
export const groupItemsByStore = (
  cartItems: CartItem[],
  storeInfo: any[]
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
      console.warn("CartScreen: Item missing loja_id:", item?.produto?.id);
      return groups;
    }
    
    // Create or update store group
    if (!groups[storeId]) {
      // Get store info from our fetched storeInfo array
      const store = storeInfo.find(s => s.id === storeId) || { 
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
  
  // Add debug information
  console.log("CartScreen: Grouped items by store:", {
    storeCount: Object.keys(itemsByStore).length,
    stores: Object.keys(itemsByStore)
  });
  
  return itemsByStore;
};

export const useGroupItemsByStore = (
  cartItems: CartItem[],
  storeInfo: any[]
) => {
  return groupItemsByStore(cartItems, storeInfo);
};
