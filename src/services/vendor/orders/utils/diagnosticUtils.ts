
import { supabase } from '@/integrations/supabase/client';

// Helper to log diagnostic information with expanded checks
export const logDiagnosticInfo = async (vendorId: string): Promise<void> => {
  try {
    console.log('Running diagnostic checks for vendor ID:', vendorId);
    
    // Check if vendor profile exists in vendedores table
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', vendorId)
      .maybeSingle();
      
    if (vendorError) {
      console.error('Error checking vendor profile:', vendorError);
    } else if (!vendorData) {
      console.error('WARNING: Vendor profile not found in vendedores table with ID:', vendorId);
    } else {
      console.log('Vendor profile found:', vendorData.nome_loja);
    }
    
    // Check if the vendor has any products
    const { count: productCount, error: countError } = await supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('vendedor_id', vendorId);
      
    if (countError) {
      console.error('Error counting vendor products:', countError);
    } else {
      console.log(`Vendor has ${productCount} products in database`);
    }
    
    // Check for any orders in pedidos table
    const { count: pedidosCount, error: pedidosCountError } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('vendedor_id', vendorId);
      
    if (pedidosCountError) {
      console.error('Error counting vendor pedidos:', pedidosCountError);
    } else {
      console.log(`Vendor has ${pedidosCount} orders in pedidos table`);
    }
    
    // Check current user info
    const { data: userData } = await supabase.auth.getUser();
    if (userData && userData.user) {
      console.log('Current user ID:', userData.user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('papel, tipo_perfil')
        .eq('id', userData.user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      } else if (profileData) {
        console.log('User profile type:', profileData.tipo_perfil);
        console.log('User profile role:', profileData.papel);
        
        // If user is not a vendor, log this as an issue
        if (profileData.tipo_perfil !== 'lojista' && profileData.papel !== 'lojista') {
          console.error('CRITICAL: User profile is not set as lojista/vendor. This prevents access to vendor data!');
        }
      }
      
      // Check if vendor profile links to current user
      const { data: vendorProfile, error: vpError } = await supabase
        .from('vendedores')
        .select('id, nome_loja')
        .eq('usuario_id', userData.user.id)
        .maybeSingle();
        
      if (vpError) {
        console.error('Error checking vendor profile for current user:', vpError);
      } else if (!vendorProfile) {
        console.error('CRITICAL: No vendor profile found for current user!');
      } else {
        console.log('User has vendor profile:', vendorProfile.nome_loja);
        
        // If the provided vendorId doesn't match user's vendor profile
        if (vendorProfile.id !== vendorId) {
          console.error(`WARNING: Provided vendor ID (${vendorId}) does not match user's vendor profile ID (${vendorProfile.id})`);
        }
      }
    }
    
    // Additional checks for the order_items table
    const { count: orderItemsCount, error: orderItemsCountError } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true });
      
    if (orderItemsCountError) {
      console.error('Error checking order_items table:', orderItemsCountError);
    } else {
      console.log(`Total order_items in database: ${orderItemsCount}`);
      
      // Check some sample order items
      const { data: sampleOrderItems, error: sampleError } = await supabase
        .from('order_items')
        .select('id, order_id, produto_id')
        .limit(5);
        
      if (sampleError) {
        console.error('Error fetching sample order items:', sampleError);
      } else if (sampleOrderItems && sampleOrderItems.length > 0) {
        console.log('Sample order item:', sampleOrderItems[0]);
      }
    }
    
    // Check orders table
    const { count: ordersCount, error: ordersCountError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });
      
    if (ordersCountError) {
      console.error('Error checking orders table:', ordersCountError);
    } else {
      console.log(`Total orders in database: ${ordersCount}`);
    }
  } catch (err) {
    console.error('Error during diagnostic logging:', err);
  }
};
