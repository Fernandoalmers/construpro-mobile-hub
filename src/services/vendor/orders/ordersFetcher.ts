
import { supabase } from "@/integrations/supabase/client";
import { VendorOrder, OrderFilters } from "./types";
import { fetchCustomerInfo } from "./utils/clientInfoFetcher";
import { fetchProductsForItems } from "./utils/productFetcher";
import { 
  getVendorId, 
  getVendorProductIds, 
  getVendorOrderIds, 
  fetchOrdersByIds 
} from "./utils/orderQueries";
import { buildVendorOrder, applySearchFilter } from "./utils/orderProcessing";

// Main function to get all vendor orders - using corrected queries
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    console.log("🔍 [getVendorOrders] Starting order fetch process");
    
    // Get vendor profile
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('🚫 [getVendorOrders] No authenticated user found');
      return [];
    }
    
    console.log(`👤 [getVendorOrders] User authenticated: ${userData.user.id}`);
    
    // Get vendor id using RPC function
    const vendorId = await getVendorId();
    if (!vendorId) {
      console.error('🚫 [getVendorOrders] Vendor profile not found');
      return [];
    }
    
    console.log('🏪 [getVendorOrders] Vendor found:', vendorId);
    
    // Get all product IDs for this vendor
    const vendorProductIds = await getVendorProductIds(vendorId);
    if (vendorProductIds.length === 0) {
      console.log('⚠️ [getVendorOrders] No products found for this vendor');
      return [];
    }
    
    console.log(`📦 [getVendorOrders] Found ${vendorProductIds.length} products for vendor`);
    
    // Get order IDs that contain products from this vendor
    const orderIds = await getVendorOrderIds(vendorProductIds);
    if (orderIds.length === 0) {
      console.log('⚠️ [getVendorOrders] No orders found for this vendor');
      return [];
    }
    
    console.log(`📦 [getVendorOrders] Found ${orderIds.length} orders for vendor`);
    
    // Fetch orders using the corrected function
    const ordersData = await fetchOrdersByIds(orderIds);
    if (ordersData.length === 0) {
      console.log('⚠️ [getVendorOrders] No orders found after fetching');
      return [];
    }
    
    console.log(`✅ [getVendorOrders] Successfully fetched ${ordersData.length} orders`);
    
    // Process orders and get customer info
    const orders: VendorOrder[] = [];
    
    for (const order of ordersData) {
      try {
        const fullOrder = await buildVendorOrder(order, vendorId, vendorProductIds);
        orders.push(fullOrder);
        console.log(`✅ [getVendorOrders] Processed order ${order.id}`);
      } catch (error) {
        console.error(`❌ [getVendorOrders] Error processing order ${order.id}:`, error);
      }
    }
    
    console.log(`✅ [getVendorOrders] Returning ${orders.length} processed orders`);
    return orders;
    
  } catch (error) {
    console.error('🚫 [getVendorOrders] Unexpected error:', error);
    return [];
  }
};

/**
 * Fetches complete order details including items
 */
export const getOrderDetails = async (orderId: string): Promise<VendorOrder | null> => {
  try {
    // Get the vendor ID for the current user
    const vendorId = await getVendorId();
    if (!vendorId) return null;
    
    // Get order data using corrected function
    const ordersData = await fetchOrdersByIds([orderId]);
    if (ordersData.length === 0) {
      console.error('❌ [getOrderDetails] Order not found');
      return null;
    }
    
    const orderData = ordersData[0];
    
    // Get vendor product IDs
    const vendorProductIds = await getVendorProductIds(vendorId);
    
    // Verify this vendor has items in this order
    const { data: vendorCheck, error: vendorCheckError } = await supabase
      .from('order_items')
      .select('id')
      .eq('order_id', orderId)
      .in('produto_id', vendorProductIds)
      .limit(1);
    
    if (vendorCheckError || !vendorCheck || vendorCheck.length === 0) {
      console.error('❌ [getOrderDetails] Vendor does not have access to this order');
      return null;
    }
    
    // Build full order object
    const fullOrder = await buildVendorOrder(orderData, vendorId, vendorProductIds);
    return fullOrder;
    
  } catch (error) {
    console.error('❌ [getOrderDetails] Unexpected error:', error);
    return null;
  }
};

// Re-export for backward compatibility
export { fetchDirectVendorOrders, fetchDirectVendorOrdersWithDebug } from './utils/ordersFetcher';
