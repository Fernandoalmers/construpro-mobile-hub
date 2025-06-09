
import { supabase } from '@/integrations/supabase/client';

// Raw adjustment data from database (without vendor/user names)
export interface RawVendorAdjustment {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  valor: number;
  tipo: string;
  motivo: string;
  created_at: string;
}

export const fetchVendorAdjustments = async (): Promise<RawVendorAdjustment[]> => {
  console.log('🔍 [vendorAdjustmentsFetcher] === FIXED FETCH ALL VENDOR ADJUSTMENTS ===');
  console.log('🔍 [vendorAdjustmentsFetcher] Getting complete dataset for data integrity');
  
  // Get ALL adjustments without any limit
  const { data: allAdjustments, error: adjustmentsError } = await supabase
    .from('pontos_ajustados')
    .select('vendedor_id, usuario_id, tipo, valor, motivo, created_at, id')
    .order('created_at', { ascending: false });

  if (adjustmentsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching adjustments:', adjustmentsError);
    throw adjustmentsError;
  }

  console.log(`📊 [vendorAdjustmentsFetcher] Retrieved ${allAdjustments?.length || 0} total adjustments`);
  
  if (!allAdjustments || allAdjustments.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No adjustments found in database');
    return [];
  }

  // ENHANCED: Log vendor distribution for debugging
  const vendorCounts = new Map<string, number>();
  allAdjustments.forEach(adj => {
    const count = vendorCounts.get(adj.vendedor_id) || 0;
    vendorCounts.set(adj.vendedor_id, count + 1);
  });
  
  console.log('📊 [vendorAdjustmentsFetcher] Adjustments per vendor ID:');
  Array.from(vendorCounts.entries()).forEach(([vendorId, count]) => {
    console.log(`  - ${vendorId}: ${count} adjustments`);
  });

  console.log(`✅ [vendorAdjustmentsFetcher] Successfully returning ${allAdjustments.length} adjustments`);
  return allAdjustments;
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log('🏪 [vendorAdjustmentsFetcher] === FIXED FETCH VENDOR DATA ===');
  console.log('🏪 [vendorAdjustmentsFetcher] Fetching ALL vendors regardless of status for data integrity');
  console.log('🏪 [vendorAdjustmentsFetcher] Vendor IDs to fetch:', vendorIds);
  
  if (vendorIds.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No vendor IDs provided');
    return [];
  }
  
  // CRITICAL FIX: Fetch ALL vendors without status filters
  const { data: allVendors, error: vendorsError } = await supabase
    .from('vendedores')
    .select('id, nome_loja, status')
    .in('id', vendorIds);

  if (vendorsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching vendors:', vendorsError);
    throw vendorsError;
  }

  console.log(`🏪 [vendorAdjustmentsFetcher] Successfully retrieved ${allVendors?.length || 0} vendors`);
  
  // ENHANCED: Detailed vendor logging
  if (allVendors && allVendors.length > 0) {
    console.log('🏪 [vendorAdjustmentsFetcher] DETAILED vendor information:');
    allVendors.forEach((vendor, index) => {
      console.log(`  ${index + 1}. ID: ${vendor.id} | Nome: "${vendor.nome_loja}" | Status: ${vendor.status}`);
      
      if (vendor.nome_loja.includes('Mais Real')) {
        console.log(`    🎯 MAIS REAL VENDOR FOUND: "${vendor.nome_loja}" (Status: ${vendor.status})`);
      }
      if (vendor.nome_loja.includes('Beaba')) {
        console.log(`    🎯 BEABA VENDOR FOUND: "${vendor.nome_loja}" (Status: ${vendor.status})`);
      }
    });
    
    // VERIFICATION: Check if we have both key vendors
    const maisRealVendor = allVendors.find(v => v.nome_loja.includes('Mais Real'));
    const beabaVendor = allVendors.find(v => v.nome_loja.includes('Beaba'));
    
    console.log('🔍 [vendorAdjustmentsFetcher] Key vendors verification:');
    console.log(`  - Mais Real found: ${!!maisRealVendor} ${maisRealVendor ? `(${maisRealVendor.nome_loja})` : ''}`);
    console.log(`  - Beaba found: ${!!beabaVendor} ${beabaVendor ? `(${beabaVendor.nome_loja})` : ''}`);
  } else {
    console.log('❌ [vendorAdjustmentsFetcher] No vendors found!');
  }

  return allVendors || [];
};

export const fetchUsersForAdjustments = async (userIds: string[]) => {
  console.log('👥 [vendorAdjustmentsFetcher] === FETCH USER DATA ===');
  console.log(`👥 [vendorAdjustmentsFetcher] Fetching ${userIds.length} users`);
  
  if (userIds.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No user IDs provided');
    return [];
  }
  
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, nome')
    .in('id', userIds);

  if (usersError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching users:', usersError);
    throw usersError;
  }

  console.log(`👥 [vendorAdjustmentsFetcher] Successfully retrieved ${usersData?.length || 0} users`);
  return usersData || [];
};
