
import { AdminOrder } from './types';
import { 
  FetchOrdersParams, 
  FetchOrdersResult,
  buildOrdersQuery,
  fetchClientProfiles,
  fetchOrderItems,
  fetchProducts,
  fetchVendors,
  createLookupMaps,
  processOrders
} from './fetcher';

export const fetchAdminOrders = async (params: FetchOrdersParams = {}): Promise<FetchOrdersResult> => {
  try {
    const { page = 1, limit = 25 } = params;
    const offset = (page - 1) * limit;

    console.log(`[AdminOrders] Fetching orders - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

    // Step 1: Fetch orders WITHOUT profile JOIN to avoid RLS filtering
    const { data: orders, error, count } = await buildOrdersQuery(params);

    if (error) {
      console.error('[AdminOrders] Error fetching orders:', error);
      throw error;
    }

    if (!orders || orders.length === 0) {
      console.log('[AdminOrders] No orders found');
      return { orders: [], totalCount: count || 0, hasMore: false };
    }

    console.log(`[AdminOrders] Successfully fetched ${orders.length} orders from ${count} total`);

    // Step 2: Get client profiles separately for all orders
    const clientIds = [...new Set(orders.map(order => order.cliente_id))];
    const allProfiles = await fetchClientProfiles(clientIds);

    // Step 3: Get all order IDs to fetch items
    const orderIds = orders.map(order => order.id);
    
    // Step 4: Fetch all order items for these orders
    const allOrderItems = await fetchOrderItems(orderIds);

    // Step 5: Get all unique product IDs
    const productIds = [...new Set((allOrderItems || []).map(item => item.produto_id))];
    
    // Step 6: Fetch all products
    const allProducts = await fetchProducts(productIds);

    // Step 7: Get all unique vendor IDs
    const vendorIds = [...new Set((allProducts || []).map(p => p.vendedor_id).filter(Boolean))];
    
    // Step 8: Fetch all vendors
    const allVendors = await fetchVendors(vendorIds);

    // Step 9: Create lookup maps
    const { itemsByOrderId, productsMap, vendorsMap, profilesMap } = createLookupMaps(
      allOrderItems,
      allProducts,
      allVendors,
      allProfiles
    );

    // Step 10: Process each order
    const processedOrders = processOrders(orders, itemsByOrderId, productsMap, vendorsMap, profilesMap);

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    console.log(`[AdminOrders] Processed ${processedOrders.length} orders. Total: ${totalCount}, HasMore: ${hasMore}`);

    return {
      orders: processedOrders,
      totalCount,
      hasMore
    };

  } catch (error) {
    console.error('[AdminOrders] Error in fetchAdminOrders:', error);
    throw error;
  }
};

// Backward compatibility - export the original function signature
export const fetchAdminOrdersLegacy = async (): Promise<AdminOrder[]> => {
  const result = await fetchAdminOrders({ page: 1, limit: 50 });
  return result.orders;
};
