
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

export const fetchVendorAdjustments = async (limit?: number): Promise<RawVendorAdjustment[]> => {
  console.log('🔍 [vendorAdjustmentsFetcher] Starting fetchVendorAdjustments - fetching ALL adjustments...');
  
  // Step 1: Get ALL adjustments without any limit
  const { data: allAdjustments, error: adjustmentsError } = await supabase
    .from('pontos_ajustados')
    .select('vendedor_id, usuario_id, tipo, valor, motivo, created_at, id')
    .order('created_at', { ascending: false });

  if (adjustmentsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching adjustments:', adjustmentsError);
    throw adjustmentsError;
  }

  console.log(`📊 [vendorAdjustmentsFetcher] Retrieved ${allAdjustments?.length || 0} total adjustments from database`);

  if (!allAdjustments || allAdjustments.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No adjustments found in database');
    return [];
  }

  return allAdjustments;
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log('🏪 [vendorAdjustmentsFetcher] Fetching ALL vendors from database (removed status filter)...');
  const { data: allVendors, error: vendorsError } = await supabase
    .from('vendedores')
    .select('id, nome_loja, status')
    .in('id', vendorIds);

  if (vendorsError) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching vendors:', vendorsError);
    throw vendorsError;
  }

  console.log(`🏪 [vendorAdjustmentsFetcher] Retrieved ${allVendors?.length || 0} vendors from database`);
  console.log('🏪 [vendorAdjustmentsFetcher] DETAILED vendor info:');
  allVendors?.forEach(v => {
    console.log(`  - ID: ${v.id} | Nome: ${v.nome_loja} | Status: ${v.status}`);
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

  return usersData || [];
};
