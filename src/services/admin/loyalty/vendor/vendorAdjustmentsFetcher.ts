
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
  console.log('🔍 [vendorAdjustmentsFetcher] === FETCHING ALL VENDOR ADJUSTMENTS ===');
  console.log('🔍 [vendorAdjustmentsFetcher] NO LIMITS APPLIED - Getting complete dataset');
  
  // Get ALL adjustments without any limit - this ensures consistency
  const { data: allAdjustments, error: adjustmentsError } = await supabase
    .from('pontos_ajustados')
    .select('vendedor_id, usuario_id, tipo, valor, motivo, created_at, id')
    .order('created_at', { ascending: false });

  if (adjustmentsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching adjustments:', adjustmentsError);
    throw adjustmentsError;
  }

  console.log(`📊 [vendorAdjustmentsFetcher] Successfully retrieved ${allAdjustments?.length || 0} total adjustments`);
  
  if (!allAdjustments || allAdjustments.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No adjustments found in database');
    return [];
  }

  // Log vendor distribution for debugging
  const vendorCounts = allAdjustments.reduce((acc, adj) => {
    acc[adj.vendedor_id] = (acc[adj.vendedor_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 [vendorAdjustmentsFetcher] Adjustments per vendor ID:');
  Object.entries(vendorCounts).forEach(([vendorId, count]) => {
    console.log(`  - ${vendorId}: ${count} adjustments`);
  });

  return allAdjustments;
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log('🏪 [vendorAdjustmentsFetcher] === FETCHING VENDOR DATA ===');
  console.log('🏪 [vendorAdjustmentsFetcher] NO STATUS FILTERS - Getting all vendors regardless of status');
  console.log('🏪 [vendorAdjustmentsFetcher] Vendor IDs to fetch:', vendorIds);
  
  // NO status filters to ensure we get all vendors
  const { data: allVendors, error: vendorsError } = await supabase
    .from('vendedores')
    .select('id, nome_loja, status')
    .in('id', vendorIds);

  if (vendorsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching vendors:', vendorsError);
    throw vendorsError;
  }

  console.log(`🏪 [vendorAdjustmentsFetcher] Successfully retrieved ${allVendors?.length || 0} vendors`);
  console.log('🏪 [vendorAdjustmentsFetcher] DETAILED vendor info:');
  allVendors?.forEach(v => {
    console.log(`  - ID: ${v.id} | Nome: "${v.nome_loja}" | Status: ${v.status}`);
    if (v.nome_loja.includes('Mais Real')) {
      console.log(`    🎯 MAIS REAL VENDOR FOUND: "${v.nome_loja}" (Status: ${v.status})`);
    }
  });

  return allVendors || [];
};

export const fetchUsersForAdjustments = async (userIds: string[]) => {
  console.log('👥 [vendorAdjustmentsFetcher] Fetching user data...');
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, nome')
    .in('id', userIds);

  if (usersError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching users:', usersError);
    throw usersError;
  }

  console.log(`👥 [vendorAdjustmentsFetcher] Retrieved ${usersData?.length || 0} users`);
  return usersData || [];
};
