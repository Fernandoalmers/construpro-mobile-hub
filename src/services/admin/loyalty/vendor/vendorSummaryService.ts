
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('🔍 [vendorSummaryService] === STARTING CORRECTED VENDOR ADJUSTMENTS SUMMARY ===');
    console.log('🔍 [vendorSummaryService] Timestamp:', new Date().toISOString());

    // Step 1: Get ALL adjustments first
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.log('⚠️ [vendorSummaryService] No adjustments found');
      return [];
    }

    // Step 2: Get unique vendor IDs and fetch vendor data separately
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log('🔍 [vendorSummaryService] Unique vendor IDs from adjustments:', uniqueVendorIds);

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.log('⚠️ [vendorSummaryService] No vendors found for adjustments');
      return [];
    }

    // Step 3: Process data
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);

    console.log('🔍 [vendorSummaryService] === ENDING CORRECTED VENDOR ADJUSTMENTS SUMMARY ===');
    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] Error in getVendorAdjustmentsSummary:', error);
    toast.error('Erro ao buscar resumo de ajustes por vendedor');
    return [];
  }
};
