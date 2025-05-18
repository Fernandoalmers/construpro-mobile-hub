
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder } from './types';
import { fetchCustomerInfo } from './utils/clientInfoFetcher';
import { fetchProductsForItems } from './utils/productFetcher';
import { getVendorProductIds } from './utils/productFetcher';
import { logDiagnosticInfo } from './utils/diagnosticUtils';

// Main function to get all vendor orders
export const getVendorOrders = async (): Promise<VendorOrder[]> => {
  try {
    // Get vendor profile
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('No authenticated user found');
      return [];
    }
    
    // Get vendor id
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id, status')
      .eq('usuario_id', userData.user.id)
      .single();
      
    if (vendorError || !vendorData) {
      console.error('Vendor profile not found:', vendorError);
      return [];
    }
    
    const vendorId = vendorData.id;
    
    console.log('Fetching orders for vendor:', vendorId);
    console.log('Vendor profile details:', {
      nome_loja: vendorData.nome_loja,
      usuario_id: vendorData.usuario_id,
      status: vendorData.status || 'unknown'
    });
    
    // Get all products for this vendor
    const productIds = await getVendorProductIds(vendorId);
    if (!productIds.length) {
      console.log('No products found for vendor, cannot fetch orders');
      await logDiagnosticInfo(vendorId);
      return [];
    }
    
    console.log(`Found ${productIds.length} products, fetching related orders`);
    
    // Get orders through order_items
    const vendorOrders = await fetchOrdersFromOrderItems(vendorId, productIds);
    
    console.log(`Processed ${vendorOrders.length} vendor orders`);
    
    // Sort orders by date, newest first
    vendorOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // If no orders were found, log diagnostic information
    if (vendorOrders.length === 0) {
      console.log('Warning: No orders found for vendor. Running diagnostics...');
      await logDiagnosticInfo(vendorId);
      
      // Check vendor status
      if (vendorData.status === 'pendente') {
        console.log('Warning: Vendor status is "pendente" which may prevent orders from being retrieved');
        console.log('Consider updating vendor status to "ativo"');
      }
    }
    
    return vendorOrders;
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

// Import the function for fetching orders through order_items
import { fetchOrdersFromOrderItems } from './utils/ordersFetcher';

// Re-export getVendorProductIds for backward compatibility
export { getVendorProductIds } from './utils/productFetcher';
