
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('📊 [vendorSummaryService] Getting vendor adjustments summary');

    // Fetch all adjustments (now works with admin policy)
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.warn('⚠️ [vendorSummaryService] No adjustments found');
      toast.warning('Nenhum ajuste encontrado');
      return [];
    }

    console.log(`📊 [vendorSummaryService] Found ${allAdjustments.length} adjustments`);

    // Get unique vendor IDs and fetch vendor data
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log(`🏪 [vendorSummaryService] Fetching data for ${uniqueVendorIds.length} vendors`);

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.error('❌ [vendorSummaryService] No vendors found');
      toast.error('Vendedores não encontrados');
      return [];
    }

    console.log(`🏪 [vendorSummaryService] Found ${vendorsData.length} vendors`);

    // Process the summary data
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);
    
    console.log(`✅ [vendorSummaryService] Summary created with ${result.length} vendors`);
    
    if (result.length > 0) {
      toast.success(`Resumo carregado: ${result.length} vendedores, ${allAdjustments.length} ajustes`);
    }

    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] Error getting vendor adjustments summary:', error);
    toast.error('Erro ao carregar resumo de ajustes');
    return [];
  }
};
