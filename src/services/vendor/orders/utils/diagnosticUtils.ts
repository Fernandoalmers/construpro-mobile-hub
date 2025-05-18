
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '@/services/vendorProfileService';

export const logDiagnosticInfo = async (vendorId: string) => {
  try {
    console.log(`🔍 [diagnosticUtils] Running diagnostic checks for vendor: ${vendorId}`);
    
    // Check vendor profile
    const { data: vendorProfile, error: vendorError } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', vendorId)
      .single();
      
    if (vendorError) {
      console.error('🚫 [diagnosticUtils] Error fetching vendor profile:', vendorError);
    } else {
      console.log('ℹ️ [diagnosticUtils] Vendor profile:', vendorProfile);
    }
    
    // Check vendor products
    const { data: products, error: productsError } = await supabase
      .from('produtos')
      .select('id, nome, status')
      .eq('vendedor_id', vendorId);
      
    if (productsError) {
      console.error('🚫 [diagnosticUtils] Error fetching vendor products:', productsError);
    } else {
      console.log(`ℹ️ [diagnosticUtils] Vendor has ${products.length} products`);
      console.log('ℹ️ [diagnosticUtils] Product status breakdown:', 
        products.reduce((acc: Record<string, number>, product) => {
          acc[product.status] = (acc[product.status] || 0) + 1;
          return acc;
        }, {})
      );
    }
    
    // Check order_items for this vendor's products
    if (products && products.length > 0) {
      const productIds = products.map(p => p.id);
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, order_id')
        .in('produto_id', productIds)
        .limit(100);
        
      if (orderItemsError) {
        console.error('🚫 [diagnosticUtils] Error fetching order items:', orderItemsError);
      } else {
        console.log(`ℹ️ [diagnosticUtils] Found ${orderItemsData?.length || 0} order items for vendor products`);
      }
    }
    
    // Check for the existence of the order_items table - using a safer approach
    // instead of trying to call an RPC function that might not exist
    const { data: tableInfoData, error: tableError } = await supabase
      .from('order_items')
      .select('count')
      .limit(1);
      
    if (tableError) {
      console.error('🚫 [diagnosticUtils] Error checking order_items table:', tableError);
    } else {
      console.log('ℹ️ [diagnosticUtils] order_items table exists:', tableInfoData !== null);
    }
    
    // Count total order_items
    const { data: itemsCount, error: countError } = await supabase
      .from('order_items')
      .select('count');
      
    if (countError) {
      console.error('🚫 [diagnosticUtils] Error counting order items:', countError);
    } else if (itemsCount && itemsCount.length > 0) {
      console.log(`ℹ️ [diagnosticUtils] Total order_items in database: ${itemsCount[0]?.count || 0}`);
    }
    
    // Return diagnostic info
    return {
      vendorProfile,
      productCount: products?.length || 0,
      productStatuses: products ? products.reduce((acc: Record<string, number>, product) => {
        acc[product.status] = (acc[product.status] || 0) + 1;
        return acc;
      }, {}) : {},
      orderItemsCount: orderItemsData?.length || 0,
      diagnosticTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('🚫 [diagnosticUtils] Error running diagnostics:', error);
    return { error: String(error) };
  }
};

export const runVendorDiagnostics = async () => {
  try {
    console.log('🔍 [runVendorDiagnostics] Starting vendor diagnostics');
    
    // Get current vendor
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('🚫 [runVendorDiagnostics] No vendor profile found');
      return { error: 'No vendor profile found' };
    }
    
    // Run diagnostics
    const diagnosticInfo = await logDiagnosticInfo(vendorProfile.id);
    
    return {
      vendorProfile,
      diagnosticInfo,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('🚫 [runVendorDiagnostics] Error:', error);
    return { error: String(error) };
  }
};

export const updateVendorStatus = async (vendorId: string, status: 'ativo' | 'pendente' | 'inativo') => {
  try {
    console.log(`🔧 [updateVendorStatus] Updating vendor ${vendorId} status to ${status}`);
    
    const { data, error } = await supabase
      .from('vendedores')
      .update({ status })
      .eq('id', vendorId);
      
    if (error) {
      console.error('🚫 [updateVendorStatus] Error updating vendor status:', error);
      return { success: false, error };
    }
    
    console.log(`✅ [updateVendorStatus] Successfully updated vendor status to ${status}`);
    return { success: true, data };
  } catch (error) {
    console.error('🚫 [updateVendorStatus] Error:', error);
    return { success: false, error: String(error) };
  }
};
