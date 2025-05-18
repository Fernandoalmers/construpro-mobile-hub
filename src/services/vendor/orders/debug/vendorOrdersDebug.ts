
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '@/services/vendorProfileService';
import { runVendorDiagnostics } from '@/services/vendor/orders/utils/diagnosticUtils';

/**
 * A debugging utility specifically designed to find issues with vendor orders
 * This can be used in development to troubleshoot why orders aren't appearing
 */
export const debugVendorOrders = async () => {
  try {
    console.group('===== VENDOR ORDERS DEBUG =====');
    
    // 1. Check authentication status
    const { data: authData } = await supabase.auth.getUser();
    console.log('Current user:', authData?.user?.id || 'Not authenticated');
    
    if (!authData?.user) {
      console.error('Not authenticated - login required');
      console.groupEnd();
      return { success: false, reason: 'not_authenticated' };
    }
    
    // 2. Run comprehensive diagnostics
    console.log('Running vendor diagnostics...');
    const diagnostics = await runVendorDiagnostics();
    console.log('Diagnostics results:', diagnostics);
    
    // 3. Check vendor profile specific information
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('No vendor profile found');
      console.groupEnd();
      return { 
        success: false, 
        reason: 'no_vendor_profile',
        // Fixed: Use type guard to ensure diagnostics has userProfile property
        diagnosticData: diagnostics
      };
    }
    
    console.log('Vendor profile:', {
      id: vendorProfile.id,
      nome_loja: vendorProfile.nome_loja,
      usuario_id: vendorProfile.usuario_id
    });
    
    // 4. Check for direct orders in pedidos table
    const { data: directOrders, error: directOrdersError } = await supabase
      .from('pedidos')
      .select('id, status, created_at, valor_total')
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
      
    if (directOrdersError) {
      console.error('Error checking direct orders:', directOrdersError);
    } else {
      console.log(`Direct orders in 'pedidos': ${directOrders?.length || 0}`);
      if (directOrders && directOrders.length > 0) {
        console.log('Most recent direct orders:', directOrders.slice(0, 3));
      }
    }
    
    // 5. Get product IDs to check order_items
    const { data: productData, error: productsError } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorProfile.id);
      
    if (productsError) {
      console.error('Error fetching product IDs:', productsError);
    } else {
      const productIds = productData?.map(p => p.id) || [];
      console.log(`Vendor has ${productIds.length} products`);
      
      if (productIds.length > 0) {
        // Check for order items with these products
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('order_id, produto_id')
          .in('produto_id', productIds)
          .limit(10);
          
        if (orderItemsError) {
          console.error('Error checking order items:', orderItemsError);
        } else {
          console.log(`Found ${orderItems?.length || 0} order items containing vendor products`);
          
          if (orderItems && orderItems.length > 0) {
            const orderIds = [...new Set(orderItems.map(item => item.order_id))];
            console.log(`These belong to ${orderIds.length} unique orders`);
            
            // Get these orders
            const { data: indirectOrders, error: indirectOrdersError } = await supabase
              .from('orders')
              .select('id, status, created_at, valor_total')
              .in('id', orderIds)
              .order('created_at', { ascending: false });
              
            if (indirectOrdersError) {
              console.error('Error fetching indirect orders:', indirectOrdersError);
            } else {
              console.log(`Indirect orders in 'orders': ${indirectOrders?.length || 0}`);
              if (indirectOrders && indirectOrders.length > 0) {
                console.log('Most recent indirect orders:', indirectOrders.slice(0, 3));
              }
            }
          }
        }
      }
    }
    
    console.log('===== DEBUG COMPLETE =====');
    console.groupEnd();
    
    return { 
      success: true, 
      vendorProfile, 
      diagnostics,
      directOrdersCount: directOrders?.length || 0
    };
  } catch (error) {
    console.error('Error in debugVendorOrders:', error);
    console.groupEnd();
    return { success: false, error: String(error), timestamp: new Date().toISOString() };
  }
};

// Additional helper to check if tables exist and have the expected structure
export const checkDatabaseSchema = async () => {
  try {
    console.group('===== DATABASE SCHEMA CHECK =====');
    
    // Check if the pedidos table exists and has vendedor_id column
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('vendedor_id')
      .limit(1);
      
    if (pedidosError) {
      console.error('Error checking pedidos table:', pedidosError);
      if (pedidosError.message.includes('does not exist')) {
        console.error('The pedidos table does not exist in the database!');
      }
    } else {
      console.log('pedidos table exists with vendedor_id column');
    }
    
    // Check if the order_items table exists
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('produto_id')
      .limit(1);
      
    if (orderItemsError) {
      console.error('Error checking order_items table:', orderItemsError);
      if (orderItemsError.message.includes('does not exist')) {
        console.error('The order_items table does not exist in the database!');
      }
    } else {
      console.log('order_items table exists with produto_id column');
    }
    
    // Check if the products/produtos tables exist
    const { data: produtosData, error: produtosError } = await supabase
      .from('produtos')
      .select('vendedor_id')
      .limit(1);
      
    if (produtosError) {
      console.error('Error checking produtos table:', produtosError);
    } else {
      console.log('produtos table exists with vendedor_id column');
    }
    
    console.log('===== SCHEMA CHECK COMPLETE =====');
    console.groupEnd();
    
  } catch (error) {
    console.error('Error checking database schema:', error);
    console.groupEnd();
  }
};
