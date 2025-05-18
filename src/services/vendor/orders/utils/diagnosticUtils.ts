import { supabase } from '@/integrations/supabase/client';

// Log diagnostic information for debugging
export const logDiagnosticInfo = async (vendorId: string): Promise<any> => {
  try {
    console.log('Running diagnostics for vendor:', vendorId);
    
    // Create a diagnostics object to store results
    const diagnosticInfo: Record<string, any> = {};
    
    // 1. Verify vendor exists
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('id, nome_loja, usuario_id, status')
      .eq('id', vendorId)
      .single();
      
    if (vendorError || !vendorData) {
      console.error('Vendor not found in database:', vendorError);
      diagnosticInfo.vendorExists = false;
      return diagnosticInfo;
    }
    
    diagnosticInfo.vendorExists = true;
    diagnosticInfo.vendorProfile = vendorData;
    diagnosticInfo.vendorStatus = vendorData.status || 'unknown';
    
    console.log('Vendor exists:', vendorData.nome_loja);
    console.log('Vendor status:', vendorData.status || 'unknown');
    
    // 2. Check for vendor's products
    const { data: productsData, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, status')
      .eq('vendedor_id', vendorId);
      
    if (productsError) {
      console.error('Error fetching products:', productsError);
      diagnosticInfo.productsError = productsError.message;
    } else {
      diagnosticInfo.productCount = productsData?.length || 0;
      diagnosticInfo.productsWithStatus = {};
      
      // Count products by status
      if (productsData && productsData.length > 0) {
        productsData.forEach(product => {
          const status = product.status || 'unknown';
          diagnosticInfo.productsWithStatus[status] = 
            (diagnosticInfo.productsWithStatus[status] || 0) + 1;
        });
        
        console.log(`Found ${productsData.length} products`);
        console.log('Products by status:', diagnosticInfo.productsWithStatus);
        
        // 3. Check for order items related to these products
        if (productsData.length > 0) {
          const productIds = productsData.map(p => p.id);
          
          const { data: orderItemsCountResult, error: orderItemsError } = await supabase
            .from('order_items')
            .select('count', { count: 'exact', head: true });
            
          if (orderItemsError) {
            console.error('Error checking order items:', orderItemsError);
            diagnosticInfo.orderItemsError = orderItemsError.message;
          } else {
            // Fix: Extract the count value correctly
            diagnosticInfo.orderItemsCount = orderItemsCountResult || 0;
            console.log(`Found ${diagnosticInfo.orderItemsCount} order items for vendor products`);
            
            // If we have order items, check for corresponding orders
            if (diagnosticInfo.orderItemsCount > 0) {
              const { data: orderItemsSample, error: sampleError } = await supabase
                .from('order_items')
                .select('order_id')
                .in('produto_id', productIds)
                .limit(10);
                
              if (!sampleError && orderItemsSample) {
                const orderIds = [...new Set(orderItemsSample.map(item => item.order_id))];
                diagnosticInfo.sampleOrderIds = orderIds;
                
                const { data: ordersData, error: ordersError } = await supabase
                  .from('orders')
                  .select('id, status, created_at')
                  .in('id', orderIds);
                  
                if (ordersError) {
                  console.error('Error checking orders:', ordersError);
                  diagnosticInfo.ordersError = ordersError.message;
                } else {
                  diagnosticInfo.sampleOrdersFound = ordersData?.length || 0;
                  console.log(`Found ${diagnosticInfo.sampleOrdersFound} orders out of ${orderIds.length} sampled`);
                }
              }
            }
          }
        }
      } else {
        console.log('No products found for vendor');
      }
    }
    
    return diagnosticInfo;
  } catch (error) {
    console.error('Error in logDiagnosticInfo:', error);
    return { error: String(error) };
  }
};

// Update vendor status if needed
export const updateVendorStatus = async (vendorId: string, newStatus: string): Promise<{ success: boolean, error?: string }> => {
  try {
    console.log(`Updating vendor ${vendorId} status to ${newStatus}`);
    
    const { error } = await supabase
      .from('vendedores')
      .update({ status: newStatus })
      .eq('id', vendorId);
      
    if (error) {
      console.error('Error updating vendor status:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully updated vendor status to ${newStatus}`);
    return { success: true };
  } catch (error) {
    console.error('Error in updateVendorStatus:', error);
    return { success: false, error: String(error) };
  }
};

// Run comprehensive vendor diagnostics
export const runVendorDiagnostics = async (): Promise<any> => {
  try {
    // Get current vendor
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { error: 'No authenticated user' };
    }
    
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('*')
      .eq('usuario_id', userData.user.id)
      .single();
      
    if (vendorError || !vendorData) {
      return { error: 'Vendor profile not found' };
    }
    
    // Run diagnostics on this vendor
    return await logDiagnosticInfo(vendorData.id);
  } catch (error) {
    console.error('Error in runVendorDiagnostics:', error);
    return { error: String(error) };
  }
};
