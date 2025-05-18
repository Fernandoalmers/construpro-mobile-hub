
import { supabase } from '@/integrations/supabase/client';
import { getVendorProfile } from '../../../vendorProfileService';

// Log diagnostic information to help troubleshoot order issues
export const logDiagnosticInfo = async (vendorId: string): Promise<void> => {
  try {
    console.group('===== DIAGNOSTIC INFO =====');
    
    // Check current user
    const { data: authData } = await supabase.auth.getUser();
    console.log('Current user ID:', authData?.user?.id || 'Not authenticated');
    
    // Check vendor profile details
    if (vendorId !== 'unknown-vendor-id') {
      const { data: vendorData } = await supabase
        .from('vendedores')
        .select('*')
        .eq('id', vendorId)
        .single();
      
      console.log('Vendor profile from database:', vendorData);
    } else {
      // Try to get vendor profile from service
      const vendorProfile = await getVendorProfile();
      console.log('Vendor profile from service:', vendorProfile);
    }
    
    // Check pedidos table
    const { data: pedidosSample } = await supabase
      .from('pedidos')
      .select('id, vendedor_id, status')
      .limit(5);
      
    console.log('Recent entries in pedidos table:', pedidosSample);
    
    // Check order_items table
    const { data: orderItemsSample } = await supabase
      .from('order_items')
      .select('order_id, produto_id')
      .limit(5);
      
    console.log('Recent entries in order_items table:', orderItemsSample);
    
    console.log('===== END DIAGNOSTIC INFO =====');
    console.groupEnd();
  } catch (error) {
    console.error('Error in logDiagnosticInfo:', error);
  }
};

// Run comprehensive diagnostics for vendor orders
export const runVendorDiagnostics = async () => {
  try {
    const profile = await getVendorProfile();
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      userProfile: null,
      vendorProfile: profile,
      databaseChecks: {
        pedidosTable: null,
        orderItemsTable: null,
        produtosTable: null
      },
      vendorProducts: []
    };
    
    // Get current user info
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      diagnostics.userProfile = userProfile;
    }
    
    // Check vendor's products
    if (profile?.id) {
      const { data: products } = await supabase
        .from('produtos')
        .select('id, nome, status')
        .eq('vendedor_id', profile.id)
        .limit(20);
        
      diagnostics.vendorProducts = products || [];
      
      // Check if there are any orders for this vendor
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, status, created_at')
        .eq('vendedor_id', profile.id)
        .limit(5);
        
      diagnostics.databaseChecks.pedidosTable = {
        hasRecords: pedidos && pedidos.length > 0,
        sample: pedidos
      };
    }
    
    return diagnostics;
  } catch (error) {
    console.error('Error running vendor diagnostics:', error);
    return { error: String(error), timestamp: new Date().toISOString() };
  }
};
