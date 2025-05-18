
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '@/services/vendorProfileService';

// Define simple primitive types to avoid circular references
type SimpleDiagnosticResults = {
  currentUser: string | null;
  userProfile: Record<string, any> | null;
  vendorProfile: Record<string, any> | null;
  productCounts: {
    produtos: number;
    products: number;
  };
  orderCounts: {
    pedidos: number;
    orders: number;
  };
};

/**
 * Run comprehensive diagnostics on vendor data
 * This utility function performs checks on the vendor's profile, products, and orders
 */
export const runVendorDiagnostics = async (): Promise<SimpleDiagnosticResults> => {
  console.log('Running vendor diagnostics...');
  
  const results: SimpleDiagnosticResults = {
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
    const authData = await supabase.auth.getUser();
    const userData = authData.data;
    results.currentUser = userData?.user?.id || null;
    console.log('Current authenticated user:', userData?.user?.id);
    
    if (!userData?.user?.id) {
      console.error('No authenticated user found');
      return results;
    }
    
    // Step 2: Check user profile
    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    
    const profileData = profileResult.data;
    results.userProfile = profileData;
    console.log('User profile:', profileData ? 'Found' : 'Not found', 
      profileData ? `(type: ${profileData.tipo_perfil}, role: ${profileData.papel})` : '');
    
    // Step 3: Check vendor profile
    const vendorProfile = await getVendorProfile();
    results.vendorProfile = vendorProfile;
    console.log('Vendor profile:', vendorProfile ? 'Found' : 'Not found', 
      vendorProfile ? `(id: ${vendorProfile.id}, nome_loja: ${vendorProfile.nome_loja})` : '');
    
    if (!vendorProfile?.id) {
      console.warn('No vendor profile found for current user');
      return results;
    }
    
    // Step 4: Check products in 'produtos' table
    const produtosResult = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true }) as unknown as { 
        count: number | null;
        error: any | null;
      };
      
    results.productCounts.produtos = produtosResult.count || 0;
    console.log(`Vendor has ${produtosResult.count || 0} products in 'produtos' table`);
    
    // Step 5: Check products in alternative 'products' table
    const productsResult = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true }) as unknown as { 
        count: number | null;
        error: any | null;
      };
      
    results.productCounts.products = productsResult.count || 0;
    console.log(`Vendor has ${productsResult.count || 0} products in 'products' table`);
    
    // Step 6: Check orders in 'pedidos' table
    const pedidosResult = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true }) as unknown as { 
        count: number | null;
        error: any | null;
      };
      
    results.orderCounts.pedidos = pedidosResult.count || 0;
    console.log(`Vendor has ${pedidosResult.count || 0} orders in 'pedidos' table`);
    
    // Step 7: Check orders in 'orders' table
    const ordersResult = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true }) as unknown as { 
        count: number | null;
        error: any | null;
      };
      
    results.orderCounts.orders = ordersResult.count || 0;
    console.log(`Vendor has ${ordersResult.count || 0} orders in 'orders' table`);
    
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
    // Count products without complex type casting
    const productResult = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true }) as unknown as {
        count: number | null;
        error: any | null;
      };
      
    console.log(`Total produtos in database: ${productResult.count || 0}`);
    if (productResult.error) console.error('Error counting produtos:', productResult.error);
    
    // Count orders in pedidos table
    const orderResult = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true }) as unknown as {
        count: number | null;
        error: any | null;
      };
      
    console.log(`Total orders in database: ${orderResult.count || 0}`);
    if (orderResult.error) console.error('Error counting pedidos:', orderResult.error);
    
    // Count order items
    const itemResult = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true }) as unknown as {
        count: number | null;
        error: any | null;
      };
      
    console.log(`Total order_items in database: ${itemResult.count || 0}`);
    if (itemResult.error) console.error('Error counting order_items:', itemResult.error);
    
    // Check for orders specifically linked to this vendor
    const vendorOrderResult = await supabase
      .from('pedidos')
      .select('id', { count: 'exact' })
      .eq('vendedor_id', vendorId) as unknown as {
        count: number | null;
        error: any | null;
      };
      
    console.log(`Orders in 'pedidos' with vendedor_id=${vendorId}: ${vendorOrderResult.count || 0}`);
    if (vendorOrderResult.error) console.error('Error checking vendor orders:', vendorOrderResult.error);
    
    // Check products linked to this vendor
    const vendorProductResult = await supabase
      .from('produtos')
      .select('id', { count: 'exact' })
      .eq('vendedor_id', vendorId) as unknown as {
        count: number | null;
        error: any | null;
      };
      
    console.log(`Products in 'produtos' with vendedor_id=${vendorId}: ${vendorProductResult.count || 0}`);
    if (vendorProductResult.error) console.error('Error checking vendor products:', vendorProductResult.error);
    
    // Check order items linked to this vendor's products
    if (vendorProductResult.count && vendorProductResult.count > 0) {
      // First get product IDs
      const { data: productIds } = await supabase
        .from('produtos')
        .select('id')
        .eq('vendedor_id', vendorId) as unknown as {
          data: Array<{id: string}> | null;
          error: any | null;
        };
      
      if (productIds && productIds.length > 0) {
        const productIdArray = productIds.map(p => p.id);
        
        // Then check order items with these product IDs
        const orderItemsResult = await supabase
          .from('order_items')
          .select('*', { count: 'exact' })
          .in('produto_id', productIdArray) as unknown as {
            count: number | null;
            error: any | null;
          };
          
        console.log(`Order items linked to vendor products: ${orderItemsResult.count || 0}`);
        if (orderItemsResult.error) console.error('Error checking order items:', orderItemsResult.error);
      }
    }
    
  } catch (error) {
    console.error('Error in diagnostic logging:', error);
  }
};
