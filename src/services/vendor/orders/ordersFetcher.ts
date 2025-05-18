
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder } from './types';
import { fetchCustomerInfo } from './utils/clientInfoFetcher';
import { fetchProductsForItems } from './utils/productFetcher';
import { getVendorProductIds } from './utils/productFetcher';
import { logDiagnosticInfo } from './utils/diagnosticUtils';

// Main function to get all vendor orders
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
    
    // Get vendor id
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id, status')
      .eq('usuario_id', userData.user.id)
      .single();
      
    if (vendorError || !vendorData) {
      console.error('🚫 [getVendorOrders] Vendor profile not found:', vendorError);
      return [];
    }
    
    const vendorId = vendorData.id;
    
    console.log('🏪 [getVendorOrders] Vendor found:', {
      id: vendorId,
      nome_loja: vendorData.nome_loja,
      status: vendorData.status || 'unknown'
    });
    
    // Get all products for this vendor
    console.log(`🛍️ [getVendorOrders] Fetching products for vendor: ${vendorId}`);
    const productIds = await getVendorProductIds(vendorId);
    console.log(`📊 [getVendorOrders] Found ${productIds.length} products`, productIds.slice(0, 5));
    
    if (!productIds.length) {
      console.log('⚠️ [getVendorOrders] No products found for vendor, cannot fetch orders');
      await logDiagnosticInfo(vendorId);
      return [];
    }
    
    console.log(`🔍 [getVendorOrders] Found ${productIds.length} products, fetching related orders`);
    
    // Get orders through order_items
    const vendorOrders = await fetchOrdersFromOrderItems(vendorId, productIds);
    
    console.log(`📦 [getVendorOrders] Processed ${vendorOrders.length} vendor orders`);
    
    if (vendorOrders.length > 0) {
      console.log('📦 [getVendorOrders] Sample first order:', {
        id: vendorOrders[0].id,
        status: vendorOrders[0].status,
        items_count: vendorOrders[0].itens?.length || 0,
        customer: vendorOrders[0].cliente ? 
          { name: vendorOrders[0].cliente.nome, id: vendorOrders[0].cliente.id } : 'No customer info'
      });
    }
    
    // Sort orders by date, newest first
    vendorOrders.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    // If no orders were found, log diagnostic information
    if (vendorOrders.length === 0) {
      console.log('⚠️ [getVendorOrders] No orders found for vendor. Running diagnostics...');
      await logDiagnosticInfo(vendorId);
      
      // Check vendor status
      if (vendorData.status === 'pendente') {
        console.log('⚠️ [getVendorOrders] Warning: Vendor status is "pendente" which may prevent orders from being retrieved');
        console.log('💡 [getVendorOrders] Consider updating vendor status to "ativo"');
      }
    }
    
    return vendorOrders;
  } catch (error) {
    console.error('🚫 [getVendorOrders] Error:', error);
    return [];
  }
};

// Import the function for fetching orders through order_items
import { fetchOrdersFromOrderItems } from './utils/ordersFetcher';

// Re-export getVendorProductIds for backward compatibility
export { getVendorProductIds } from './utils/productFetcher';
