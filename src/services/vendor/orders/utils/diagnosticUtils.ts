
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '@/services/vendorProfileService';

/**
 * Run comprehensive diagnostics on vendor data
 * This utility function performs checks on the vendor's profile, products, and orders
 */
export const runVendorDiagnostics = async (): Promise<Record<string, any>> => {
  console.log('Running vendor diagnostics...');
  
  const results: Record<string, any> = {
    currentUser: null,
    userProfile: null,
    vendorProfile: null,
    productCounts: {
      produtos: 0,
      products: 0
    },
    orderCounts: {
      pedidos: 0,
      orders: 0
    }
  };
  
  try {
    // Step 1: Get current user
    const { data: userData } = await supabase.auth.getUser();
    results.currentUser = userData?.user?.id;
    console.log('Current authenticated user:', userData?.user?.id);
    
    if (!userData?.user?.id) {
      console.error('No authenticated user found');
      return results;
    }
    
    // Step 2: Check user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
      
    results.userProfile = profileData;
    console.log('User profile:', profileData ? 'Found' : 'Not found', 
      profileData ? `(type: ${profileData.tipo_perfil}, role: ${profileData.papel})` : '');
    
    // Step 3: Check vendor profile
    const vendorProfile = await getVendorProfile();
    results.vendorProfile = vendorProfile;
    console.log('Vendor profile:', vendorProfile ? 'Found' : 'Not found');
    
    if (!vendorProfile?.id) {
      console.warn('No vendor profile found for current user');
      return results;
    }
    
    // Step 4: Check products in 'produtos' table
    const { count: produtosCount } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('vendedor_id', vendorProfile.id);
      
    results.productCounts.produtos = produtosCount || 0;
    console.log(`Vendor has ${produtosCount || 0} products in 'produtos' table`);
    
    // Step 5: Check products in alternative 'products' table
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendedor_id', vendorProfile.id);
      
    results.productCounts.products = productsCount || 0;
    console.log(`Vendor has ${productsCount || 0} products in 'products' table`);
    
    // Step 6: Check orders in 'pedidos' table
    const { count: pedidosCount } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('vendedor_id', vendorProfile.id);
      
    results.orderCounts.pedidos = pedidosCount || 0;
    console.log(`Vendor has ${pedidosCount || 0} orders in 'pedidos' table`);
    
    // Step 7: Check orders in 'orders' table
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendedor_id', vendorProfile.id);
      
    results.orderCounts.orders = ordersCount || 0;
    console.log(`Vendor has ${ordersCount || 0} orders in 'orders' table`);
    
    return results;
  } catch (error) {
    console.error('Error running vendor diagnostics:', error);
    return results;
  }
};

/**
 * Log extended diagnostic information about database tables
 */
export const logDiagnosticInfo = async (vendorId: string): Promise<void> => {
  if (!vendorId) {
    console.error('Cannot run diagnostics without vendor ID');
    return;
  }
  
  console.log('Running extended diagnostics for vendor:', vendorId);
  
  try {
    // Count products
    const { count: productCount, error: productError } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true });
      
    console.log(`Total produtos in database: ${productCount || 0}`);
    if (productError) console.error('Error counting produtos:', productError);
    
    // Count orders in pedidos table
    const { count: orderCount, error: orderError } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true });
      
    console.log(`Total orders in database: ${orderCount || 0}`);
    if (orderError) console.error('Error counting pedidos:', orderError);
    
    // Count order items
    const { count: orderItemCount, error: itemError } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true });
      
    console.log(`Total order_items in database: ${orderItemCount || 0}`);
    if (itemError) console.error('Error counting order_items:', itemError);
    
  } catch (error) {
    console.error('Error in diagnostic logging:', error);
  }
};
