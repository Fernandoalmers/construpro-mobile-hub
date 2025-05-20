
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, VendorOrder } from './types';
import { fetchCustomerInfo } from './utils/clientInfoFetcher';
import { fetchProductsForItems } from './utils/productFetcher';
import { fetchVendorOrders, fetchDirectVendorOrders, fetchDirectVendorOrdersWithDebug } from './utils/ordersFetcher';
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
    
    // Check vendor status
    if (vendorData.status === 'pendente') {
      console.warn('⚠️ [getVendorOrders] Vendor status is "pendente", which may affect order visibility');
    }
    
    // Use direct approach to fetch vendor orders
    console.log(`🔍 [getVendorOrders] Fetching orders directly for vendor: ${vendorId}`);
    const vendorOrders = await fetchDirectVendorOrders(vendorId);
    
    console.log(`📦 [getVendorOrders] Processed ${vendorOrders.length} vendor orders`);
    
    if (vendorOrders.length > 0) {
      console.log('📦 [getVendorOrders] Sample first order:', {
        id: vendorOrders[0].id,
        status: vendorOrders[0].status,
        items_count: vendorOrders[0].items?.length || 0,
        customer: vendorOrders[0].cliente ? 
          { name: vendorOrders[0].cliente.nome, id: vendorOrders[0].cliente.id } : 'No customer info'
      });
    }
    
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

// Re-export the direct fetching function for other components that might need it
export { fetchDirectVendorOrders, fetchDirectVendorOrdersWithDebug } from './utils/ordersFetcher';
