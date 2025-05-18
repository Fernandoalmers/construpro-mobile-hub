
import { getVendorProfile } from '../../vendorProfileService';
import { VendorOrder } from './types';
import { 
  fetchOrdersFromPedidos,
  fetchOrdersFromOrderItems
} from './utils/ordersFetcher';
import { getVendorProductIds } from './utils/orderItemsFetcher';
import { logDiagnosticInfo } from './utils/diagnosticUtils';

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
    console.log('Vendor profile details:', {
      nome_loja: vendorProfile.nome_loja,
      usuario_id: vendorProfile.usuario_id
    });
    
    // Combined array for all vendor orders
    const combinedOrders: VendorOrder[] = [];
    
    // 1. Prioritize getting orders via products and order_items (main flow)
    const productIds = await getVendorProductIds(vendorProfile.id);
    if (productIds.length > 0) {
      console.log(`Found ${productIds.length} products, checking for orders in 'order_items'`);
      const orderItemsOrders = await fetchOrdersFromOrderItems(vendorProfile.id, productIds);
      
      if (orderItemsOrders.length > 0) {
        console.log(`Found ${orderItemsOrders.length} orders via products in 'order_items'`);
        combinedOrders.push(...orderItemsOrders);
      } else {
        console.log('No orders found via products in order_items table');
      }
    } else {
      console.log('No products found for vendor, skipping order_items check');
    }
    
    // 2. Fetch orders from the pedidos table (legacy system)
    const pedidosOrders = await fetchOrdersFromPedidos(vendorProfile.id);
    if (pedidosOrders.length > 0) {
      console.log(`Found ${pedidosOrders.length} orders in 'pedidos' table (legacy system)`);
      combinedOrders.push(...pedidosOrders);
    } else {
      console.log('No orders found in pedidos table for this vendor');
    }
    
    // Sort all orders by date, newest first
    combinedOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    console.log('Total combined orders:', combinedOrders.length);
    
    if (combinedOrders.length === 0) {
      console.log('Warning: No orders found for vendor. Running diagnostics...');
      
      // Log additional diagnostic information
      const diagnostics = await logDiagnosticInfo(vendorProfile.id);
      console.log('Diagnostics completed:', diagnostics);
    }
    
    return combinedOrders;
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};
