
import { supabase } from '@/integrations/supabase/client';
import { getVendorProductIds, diagnoseBrokenConnections } from './orderItemsFetcher';

// Log additional diagnostic information
export const logDiagnosticInfo = async (vendorId: string) => {
  console.log('Running vendor order diagnostics...');
  
  try {
    // Try to get vendor profile directly, including status
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id, status')
      .eq('id', vendorId)
      .single();
    
    if (vendorError) {
      console.error('Error fetching vendor profile:', vendorError);
    } else {
      console.log('Vendor profile found:', vendorData);
      
      // Check if vendor status is "pendente"
      if (vendorData.status === 'pendente') {
        console.warn('⚠️ IMPORTANT: Vendor status is "pendente" which might be preventing orders from showing');
        console.warn('Consider updating the vendor status to "ativo" in the database');
        
        // Attempt direct check of data visibility based on status
        console.log('Testing if vendor status affects data visibility...');
      }
    }
    
    // Check both old and new table structures
    
    // Check for any pedidos for this vendor (old table)
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('vendedor_id', vendorId)
      .limit(5);
    
    if (pedidosError) {
      console.error('Error checking pedidos:', pedidosError);
    } else {
      console.log(`Found ${pedidosData.length} pedidos directly linked to vendor`);
    }
    
    // Now check products table
    const { data: productIds, error: productError } = await supabase
      .from('produtos')
      .select('id, status')
      .eq('vendedor_id', vendorId);
      
    if (productError) {
      console.error('Error fetching vendor products:', productError);
    } else {
      console.log(`Found ${productIds.length} products for vendor ${vendorId}`);
      
      // Group products by status
      const productsByStatus: Record<string, number> = {};
      productIds.forEach(p => {
        const status = p.status || 'unknown';
        productsByStatus[status] = (productsByStatus[status] || 0) + 1;
      });
      
      console.log('Products by status:', productsByStatus);
      
      if (productIds.length > 0) {
        // Check for order_items containing these products
        const prodIds = productIds.map(p => p.id);
        const { data: orderItemsData, error: orderItemsError } = await supabase
          .from('order_items')
          .select('order_id, produto_id')
          .in('produto_id', prodIds);
          
        if (orderItemsError) {
          console.error('Error checking order_items:', orderItemsError);
        } else {
          console.log(`Found ${orderItemsData.length} order items with vendor products`);
          
          if (orderItemsData.length > 0) {
            // Get unique order IDs
            const orderIds = [...new Set(orderItemsData.map(item => item.order_id))];
            console.log(`Found ${orderIds.length} unique orders with vendor products`);
            console.log('Order IDs sample:', orderIds.slice(0, 3));
            
            // Check these orders in orders table
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('id, status, valor_total, created_at')
              .in('id', orderIds);
              
            if (ordersError) {
              console.error('Error checking orders table:', ordersError);
            } else {
              console.log(`Found ${ordersData.length} matching orders in orders table`);
              if (ordersData.length > 0) {
                // Sort by date
                ordersData.sort((a, b) => 
                  new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
                );
                console.log('Most recent order:', ordersData[0]);
              }
            }
          }
        }
      }
    }
    
    // Get vendor products
    const productIds2 = await getVendorProductIds(vendorId);
    console.log(`Found ${productIds2.length} product IDs using getVendorProductIds`);
    
    // Check total number of order_items in the system
    const { count: orderItemsCount, error: countError } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting order_items:', countError);
    } else {
      console.log(`Total order_items in system: ${orderItemsCount}`);
    }
    
    // Run the comprehensive diagnostics
    const diagnostics = await diagnoseBrokenConnections(vendorId);
    console.log('Comprehensive diagnostics:', diagnostics);
    
    // Return comprehensive diagnostic information
    return {
      vendorProfile: vendorData || null,
      vendorStatus: vendorData?.status || 'unknown',
      directPedidosCount: pedidosData?.length || 0,
      productCount: productIds2.length,
      totalOrderItemsInSystem: orderItemsCount || 0,
      connections: diagnostics
    };
    
  } catch (error) {
    console.error('Error in diagnostic function:', error);
    return {
      error: 'Failed to run diagnostics',
      details: error
    };
  }
};

// Run vendor diagnostics and return results
export const runVendorDiagnostics = async () => {
  try {
    // Get current vendor profile from vendedores table
    const { data: vendorProfile, error: profileError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id, status')
      .single();
      
    if (profileError) {
      console.error('Error fetching current vendor profile:', profileError);
      return { success: false, error: profileError };
    }
    
    if (!vendorProfile) {
      console.log('No vendor profile found for current user');
      return { success: false, error: 'No vendor profile found' };
    }
    
    console.log('Running diagnostics for vendor:', vendorProfile.nome_loja);
    console.log('Vendor status:', vendorProfile.status || 'unknown');
    
    // Run diagnostics with the vendor ID
    const diagnosticInfo = await logDiagnosticInfo(vendorProfile.id);
    
    // If vendor status is pending, add a warning
    const warningMessage = vendorProfile.status === 'pendente' 
      ? "⚠️ Vendor status is 'pendente', which may be preventing orders from displaying. Consider updating to 'ativo'."
      : null;
      
    return {
      success: true,
      vendorProfile,
      diagnosticInfo,
      warning: warningMessage
    };
    
  } catch (error) {
    console.error('Error running vendor diagnostics:', error);
    return {
      success: false,
      error
    };
  }
};

// Helper to update vendor status
export const updateVendorStatus = async (vendorId: string, status: string = 'ativo') => {
  try {
    console.log(`Updating vendor ${vendorId} status to ${status}`);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status })
      .eq('id', vendorId)
      .select();
      
    if (error) {
      console.error('Error updating vendor status:', error);
      return { success: false, error };
    }
    
    console.log('Vendor status updated successfully:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Error in updateVendorStatus:', error);
    return { success: false, error };
  }
};
