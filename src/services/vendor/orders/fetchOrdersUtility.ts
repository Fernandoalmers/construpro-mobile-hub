
import { supabase } from '@/integrations/supabase/client';
import { VendorOrder } from './types';
import { 
  fetchOrdersFromPedidos, 
  fetchOrdersFromOrderItems, 
  getVendorProductIds 
} from './utils/ordersFetcher';
import { logDiagnosticInfo } from './utils/diagnosticUtils';
import { getVendorProfile } from '../../vendorProfileService';

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
    
    // Ensure we have a valid vendor ID
    if (!vendorProfile.id) {
      console.error('Vendor ID is missing or invalid in profile');
      // Try to get it from Supabase directly as a fallback
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: vendorData } = await supabase
          .from('vendedores')
          .select('id')
          .eq('usuario_id', userData.user.id)
          .single();
          
        if (vendorData?.id) {
          console.log('Found vendor ID from direct query:', vendorData.id);
          // Use this ID instead
          vendorProfile.id = vendorData.id;
        } else {
          console.error('Could not find vendor ID even with direct query');
          return [];
        }
      }
    }
    
    // Combined array for all vendor orders
    const combinedOrders: VendorOrder[] = [];
    
    // 1. Fetch orders from the pedidos table (old structure)
    const pedidosOrders = await fetchOrdersFromPedidos(vendorProfile.id);
    if (pedidosOrders.length > 0) {
      console.log(`Found ${pedidosOrders.length} orders in 'pedidos' table`);
      combinedOrders.push(...pedidosOrders);
    } else {
      console.log('No orders found in pedidos table for this vendor');
    }
    
    // 2. Fetch orders from order_items table based on vendor products
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
    
    // Try to get some diagnostic information even in case of error
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        console.log('Current authenticated user:', userData.user.id);
        await logDiagnosticInfo('unknown-vendor-id');
      }
    } catch (err) {
      console.error('Error in error handler:', err);
    }
    
    return [];
  }
};
