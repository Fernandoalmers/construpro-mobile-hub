
import { 
  getVendorProductIds,
  fetchOrderItemsForProducts,
  fetchProductsForItems,
  createOrderItemsMap 
} from './utils/orderItemsFetcher';
import { 
  fetchOrdersFromPedidos,
  fetchOrdersById,
  processVendorOrdersFromOrderItems 
} from './utils/ordersFetcher';
import { logDiagnosticInfo } from './utils/diagnosticUtils';
import { VendorOrder } from './types';

// Helper to get orders based on product items (new structure)
export const fetchOrdersFromOrderItems = async (vendorId: string, productIds: string[]): Promise<VendorOrder[]> => {
  if (productIds.length === 0) {
    console.log('No product IDs provided for vendor', vendorId);
    return [];
  }
  
  try {
    console.log(`Fetching order items for ${productIds.length} vendor products`);
    
    // Step 1: Fetch order items
    const orderItemsData = await fetchOrderItemsForProducts(productIds);
    if (orderItemsData.length === 0) {
      return [];
    }
    
    // Get unique order IDs
    const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
    console.log('Found', orderIds.length, 'unique orders with vendor products');
    
    if (orderIds.length === 0) {
      return [];
    }
    
    // Step 2: Fetch products and create a map
    const productMap = await fetchProductsForItems(productIds);
    
    // Step 3: Create order items map
    const orderItemsMap = createOrderItemsMap(orderItemsData, productMap);
    
    // Step 4: Fetch orders data
    const ordersData = await fetchOrdersById(orderIds);
    
    if (ordersData.length === 0) {
      return [];
    }
    
    // Step 5: Process vendor orders
    return await processVendorOrdersFromOrderItems(ordersData, orderItemsMap, vendorId);
    
  } catch (error) {
    console.error('Unexpected error in fetchOrdersFromOrderItems:', error);
    return [];
  }
};

// Re-export all needed functions
export { fetchOrdersFromPedidos, getVendorProductIds, logDiagnosticInfo };
