
import { getVendorProfile } from '../../vendorProfileService';
import { VendorOrder } from './types';
import { 
  fetchOrdersFromPedidos, 
  fetchOrdersFromOrderItems, 
  getVendorProductIds,
  logDiagnosticInfo 
} from './fetchOrdersUtility';

// Main function to get all vendor orders
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    console.log('Fetching orders for vendor:', vendorProfile.id);
    
    // Combined array for all vendor orders
    const combinedOrders: VendorOrder[] = [];
    
    // 1. Fetch orders from the pedidos table (old structure)
    const pedidosOrders = await fetchOrdersFromPedidos(vendorProfile.id);
    combinedOrders.push(...pedidosOrders);
    
    // 2. Fetch orders from order_items table based on vendor products
    const productIds = await getVendorProductIds(vendorProfile.id);
    if (productIds.length > 0) {
      const orderItemsOrders = await fetchOrdersFromOrderItems(vendorProfile.id, productIds);
      combinedOrders.push(...orderItemsOrders);
    }
    
    // Sort all orders by date, newest first
    combinedOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    console.log('Total combined orders:', combinedOrders.length);
    
    if (combinedOrders.length === 0) {
      console.log('Warning: No orders found for vendor. Check if vendor profile is correct and has products/orders.');
      
      // Log additional diagnostic information
      await logDiagnosticInfo(vendorProfile.id);
    }
    
    return combinedOrders;
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};
