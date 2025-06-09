
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('🔍 [vendorSummaryService] === FIXED VENDOR ADJUSTMENTS SUMMARY ===');
    console.log('🔍 [vendorSummaryService] Timestamp:', new Date().toISOString());

    // Step 1: Get ALL adjustments
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.log('⚠️ [vendorSummaryService] No adjustments found');
      return [];
    }

    console.log(`📊 [vendorSummaryService] Found ${allAdjustments.length} total adjustments`);
    
    // ENHANCED: Log adjustment distribution by vendor
    const vendorAdjustmentCounts = new Map<string, number>();
    allAdjustments.forEach(adj => {
      const count = vendorAdjustmentCounts.get(adj.vendedor_id) || 0;
      vendorAdjustmentCounts.set(adj.vendedor_id, count + 1);
    });

    console.log('🔍 [vendorSummaryService] Adjustments by vendor ID:');
    Array.from(vendorAdjustmentCounts.entries()).forEach(([vendorId, count]) => {
      console.log(`  - ${vendorId}: ${count} adjustments`);
    });

    // Step 2: Get unique vendor IDs and fetch vendor data
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log(`🔍 [vendorSummaryService] Unique vendor IDs (${uniqueVendorIds.length}): ${uniqueVendorIds.join(', ')}`);

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.log('⚠️ [vendorSummaryService] No vendors found for adjustments');
      return [];
    }

    console.log(`🏪 [vendorSummaryService] Retrieved ${vendorsData.length} vendors`);

    // CRITICAL: Verify vendor mapping before processing
    console.log('🔍 [vendorSummaryService] VENDOR MAPPING VERIFICATION:');
    uniqueVendorIds.forEach(vendorId => {
      const vendor = vendorsData.find(v => v.id === vendorId);
      const adjustmentCount = vendorAdjustmentCounts.get(vendorId) || 0;
      
      if (vendor) {
        console.log(`  ✅ ${vendorId} -> "${vendor.nome_loja}" (Status: ${vendor.status}) | ${adjustmentCount} adjustments`);
        
        if (vendor.nome_loja.includes('Mais Real')) {
          console.log(`    🎯 MAIS REAL CONFIRMED: ID=${vendorId}, Name="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
        }
        if (vendor.nome_loja.includes('Beaba')) {
          console.log(`    🎯 BEABA CONFIRMED: ID=${vendorId}, Name="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
        }
      } else {
        console.log(`  ❌ ${vendorId} -> NOT FOUND | ${adjustmentCount} adjustments WILL BE LOST`);
      }
    });

    // Step 3: Process data with enhanced error handling
    console.log('🔄 [vendorSummaryService] Starting enhanced data processing...');
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);

    // FINAL VERIFICATION
    console.log('🔍 [vendorSummaryService] === FINAL RESULT VERIFICATION ===');
    console.log(`📊 [vendorSummaryService] Result contains ${result.length} vendor summaries`);
    
    result.forEach((summary, index) => {
      console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments`);
      
      if (summary.vendedor_nome.includes('Mais Real')) {
        console.log(`    🎉 MAIS REAL IN FINAL RESULT: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
      }
      if (summary.vendedor_nome.includes('Beaba')) {
        console.log(`    🎉 BEABA IN FINAL RESULT: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
      }
    });

    // CRITICAL: Verify both key vendors are present
    const maisRealInResult = result.find(r => r.vendedor_nome.includes('Mais Real'));
    const beabaInResult = result.find(r => r.vendedor_nome.includes('Beaba'));
    
    if (maisRealInResult && beabaInResult) {
      console.log(`🎉 [vendorSummaryService] SUCCESS: Both key vendors found in result`);
      console.log(`  - Mais Real: ${maisRealInResult.total_ajustes} adjustments`);
      console.log(`  - Beaba: ${beabaInResult.total_ajustes} adjustments`);
    } else {
      console.log('❌ [vendorSummaryService] WARNING: Missing key vendors in result');
      console.log(`  - Mais Real found: ${!!maisRealInResult}`);
      console.log(`  - Beaba found: ${!!beabaInResult}`);
      
      if (!maisRealInResult) {
        console.log('🔍 [vendorSummaryService] DEBUGGING: Why is Mais Real missing?');
        const maisRealVendor = vendorsData.find(v => v.nome_loja.includes('Mais Real'));
        if (maisRealVendor) {
          const maisRealAdjustments = allAdjustments.filter(adj => adj.vendedor_id === maisRealVendor.id);
          console.log(`  - Mais Real vendor found: ${maisRealVendor.id} -> "${maisRealVendor.nome_loja}"`);
          console.log(`  - Mais Real adjustments found: ${maisRealAdjustments.length}`);
        }
      }
    }

    console.log('🔍 [vendorSummaryService] === SUMMARY COMPLETE ===');
    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] Error in getVendorAdjustmentsSummary:', error);
    toast.error('Erro ao buscar resumo de ajustes por vendedor');
    return [];
  }
};
