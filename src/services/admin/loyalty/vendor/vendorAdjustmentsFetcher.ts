
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
  console.log('🔍 [vendorAdjustmentsFetcher] Fetching all vendor adjustments');
  
  try {
    const { data, error } = await supabase
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

    if (error) {
      console.error('❌ [vendorAdjustmentsFetcher] Error fetching adjustments:', error);
      throw error;
    }

    const count = data?.length || 0;
    console.log(`✅ [vendorAdjustmentsFetcher] Successfully fetched ${count} adjustments`);
    
    return data || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] Fatal error:', error);
    return [];
  }
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log(`🏪 [vendorAdjustmentsFetcher] Fetching ${vendorIds.length} vendors`);
  
  if (vendorIds.length === 0) {
    console.warn('⚠️ [vendorAdjustmentsFetcher] No vendor IDs provided');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        status,
        usuario_id,
        created_at
      `)
      .in('id', vendorIds);

    if (error) {
      console.error('❌ [vendorAdjustmentsFetcher] Error fetching vendors:', error);
      throw error;
    }

    const foundCount = data?.length || 0;
    console.log(`✅ [vendorAdjustmentsFetcher] Found ${foundCount} vendors`);
    
    return data || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching vendors:', error);
    throw error;
  }
};

export const fetchUsersForAdjustments = async (userIds: string[]) => {
  console.log(`👥 [vendorAdjustmentsFetcher] Fetching ${userIds.length} users`);
  
  if (userIds.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] No user IDs provided');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nome,
        email
      `)
      .in('id', userIds);

    if (error) {
      console.error('❌ [vendorAdjustmentsFetcher] Error fetching users:', error);
      throw error;
    }

    const foundCount = data?.length || 0;
    console.log(`✅ [vendorAdjustmentsFetcher] Found ${foundCount} users`);
    
    return data || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] Error fetching users:', error);
    throw error;
  }
};
