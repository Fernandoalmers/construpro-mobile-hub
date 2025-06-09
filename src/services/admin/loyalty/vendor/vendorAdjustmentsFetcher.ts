
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
  console.log('🔍 [vendorAdjustmentsFetcher] === ENHANCED FETCH ALL VENDOR ADJUSTMENTS ===');
  console.log('🔍 [vendorAdjustmentsFetcher] Getting complete dataset for data integrity');
  
  // Get ALL adjustments without any limit - use more explicit field selection
  const { data: allAdjustments, error: adjustmentsError } = await supabase
    .from('pontos_ajustados')
    .select(`
      id,
      vendedor_id,
      usuario_id,
      valor,
      tipo,
      motivo,
      created_at
    `)
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

  // CRITICAL: Enhanced vendor distribution analysis
  const vendorCounts = new Map<string, number>();
  const vendorAdjustments = new Map<string, RawVendorAdjustment[]>();
  
  allAdjustments.forEach(adj => {
    const count = vendorCounts.get(adj.vendedor_id) || 0;
    vendorCounts.set(adj.vendedor_id, count + 1);
    
    if (!vendorAdjustments.has(adj.vendedor_id)) {
      vendorAdjustments.set(adj.vendedor_id, []);
    }
    vendorAdjustments.get(adj.vendedor_id)?.push(adj);
  });
  
  console.log('📊 [vendorAdjustmentsFetcher] ENHANCED vendor analysis:');
  Array.from(vendorCounts.entries()).forEach(([vendorId, count]) => {
    console.log(`  - Vendor ID ${vendorId}: ${count} adjustments`);
    
    // Log a sample adjustment for each vendor for debugging
    const sampleAdj = vendorAdjustments.get(vendorId)?.[0];
    if (sampleAdj) {
      console.log(`    Sample: ${sampleAdj.tipo} of ${sampleAdj.valor} points (${sampleAdj.motivo})`);
    }
  });

  console.log(`✅ [vendorAdjustmentsFetcher] Successfully returning ${allAdjustments.length} adjustments from ${vendorCounts.size} vendors`);
  return allAdjustments;
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log('🏪 [vendorAdjustmentsFetcher] === ENHANCED FETCH VENDOR DATA ===');
  console.log('🏪 [vendorAdjustmentsFetcher] Fetching ALL vendors regardless of status for data integrity');
  console.log('🏪 [vendorAdjustmentsFetcher] Vendor IDs to fetch:', vendorIds);
  
  if (vendorIds.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No vendor IDs provided');
    return [];
  }
  
  // ENHANCED: More explicit query with better error handling
  const { data: allVendors, error: vendorsError } = await supabase
    .from('vendedores')
    .select(`
      id,
      nome_loja,
      status,
      usuario_id,
      created_at
    `)
    .in('id', vendorIds);

  if (vendorsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching vendors:', vendorsError);
    throw vendorsError;
  }

  console.log(`🏪 [vendorAdjustmentsFetcher] Successfully retrieved ${allVendors?.length || 0} vendors from ${vendorIds.length} requested`);
  
  // CRITICAL: Check for missing vendors
  const foundVendorIds = new Set(allVendors?.map(v => v.id) || []);
  const missingVendorIds = vendorIds.filter(id => !foundVendorIds.has(id));
  
  if (missingVendorIds.length > 0) {
    console.error('❌ [vendorAdjustmentsFetcher] CRITICAL: Missing vendors in database!');
    console.error('  Missing vendor IDs:', missingVendorIds);
    
    // This is a critical data integrity issue - we should handle it
    missingVendorIds.forEach(missingId => {
      console.error(`  🚨 Vendor ID ${missingId} has adjustments but no vendor record!`);
    });
  }
  
  // ENHANCED: Detailed vendor logging with character analysis
  if (allVendors && allVendors.length > 0) {
    console.log('🏪 [vendorAdjustmentsFetcher] ENHANCED vendor information:');
    allVendors.forEach((vendor, index) => {
      // Check for potential character encoding issues
      const nameLength = vendor.nome_loja?.length || 0;
      const hasTrailingSpaces = vendor.nome_loja !== vendor.nome_loja?.trim();
      
      console.log(`  ${index + 1}. ID: ${vendor.id}`);
      console.log(`     Name: "${vendor.nome_loja}" (${nameLength} chars, trailing spaces: ${hasTrailingSpaces})`);
      console.log(`     Status: ${vendor.status}`);
      console.log(`     Created: ${vendor.created_at}`);
      
      if (vendor.nome_loja?.toLowerCase().includes('mais real')) {
        console.log(`    🎯 MAIS REAL VENDOR FOUND: "${vendor.nome_loja}" (Status: ${vendor.status})`);
      }
      if (vendor.nome_loja?.toLowerCase().includes('beaba')) {
        console.log(`    🎯 BEABA VENDOR FOUND: "${vendor.nome_loja}" (Status: ${vendor.status})`);
      }
    });
    
    // VERIFICATION: Check if we have both key vendors
    const maisRealVendor = allVendors.find(v => v.nome_loja?.toLowerCase().includes('mais real'));
    const beabaVendor = allVendors.find(v => v.nome_loja?.toLowerCase().includes('beaba'));
    
    console.log('🔍 [vendorAdjustmentsFetcher] ENHANCED key vendors verification:');
    console.log(`  - Mais Real found: ${!!maisRealVendor} ${maisRealVendor ? `(ID: ${maisRealVendor.id}, Name: "${maisRealVendor.nome_loja}")` : ''}`);
    console.log(`  - Beaba found: ${!!beabaVendor} ${beabaVendor ? `(ID: ${beabaVendor.id}, Name: "${beabaVendor.nome_loja}")` : ''}`);
    
    if (!maisRealVendor) {
      console.error('🚨 [vendorAdjustmentsFetcher] CRITICAL ISSUE: Mais Real vendor not found!');
      console.log('   Available vendor names:', allVendors.map(v => `"${v.nome_loja}"`));
    }
  } else {
    console.log('❌ [vendorAdjustmentsFetcher] No vendors found!');
  }

  return allVendors || [];
};

export const fetchUsersForAdjustments = async (userIds: string[]) => {
  console.log('👥 [vendorAdjustmentsFetcher] === ENHANCED FETCH USER DATA ===');
  console.log(`👥 [vendorAdjustmentsFetcher] Fetching ${userIds.length} users`);
  
  if (userIds.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No user IDs provided');
    return [];
  }
  
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select(`
      id,
      nome,
      email
    `)
    .in('id', userIds);

  if (usersError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching users:', usersError);
    throw usersError;
  }

  // Check for missing users
  const foundUserIds = new Set(usersData?.map(u => u.id) || []);
  const missingUserIds = userIds.filter(id => !foundUserIds.has(id));
  
  if (missingUserIds.length > 0) {
    console.warn('⚠️ [vendorAdjustmentsFetcher] Some users not found:', missingUserIds);
  }

  console.log(`👥 [vendorAdjustmentsFetcher] Successfully retrieved ${usersData?.length || 0} users from ${userIds.length} requested`);
  return usersData || [];
};
