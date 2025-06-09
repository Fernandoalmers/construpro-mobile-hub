
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('🔍 [vendorSummaryService] === STARTING ENHANCED VENDOR ADJUSTMENTS SUMMARY ===');
    console.log('🔍 [vendorSummaryService] Timestamp:', new Date().toISOString());

    // Step 1: Get ALL adjustments first
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.log('⚠️ [vendorSummaryService] No adjustments found');
      return [];
    }

    console.log(`📊 [vendorSummaryService] Total adjustments found: ${allAdjustments.length}`);
    
    // CRITICAL DEBUG: Log all adjustments with vendor info
    console.log('🔍 [vendorSummaryService] ALL ADJUSTMENTS BREAKDOWN:');
    const vendorAdjustmentCounts = new Map<string, number>();
    allAdjustments.forEach((adj, index) => {
      const count = vendorAdjustmentCounts.get(adj.vendedor_id) || 0;
      vendorAdjustmentCounts.set(adj.vendedor_id, count + 1);
      if (index < 5) { // Log first 5 for debugging
        console.log(`  ${index + 1}. Vendor ID: ${adj.vendedor_id} | Points: ${adj.valor} | Type: ${adj.tipo}`);
      }
    });

    // Step 2: Get unique vendor IDs and fetch vendor data separately
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log('🔍 [vendorSummaryService] Unique vendor IDs from adjustments:', uniqueVendorIds);
    console.log('🔍 [vendorSummaryService] Vendor adjustment counts:', Object.fromEntries(vendorAdjustmentCounts));

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.log('⚠️ [vendorSummaryService] No vendors found for adjustments');
      return [];
    }

    console.log(`🏪 [vendorSummaryService] Vendors data retrieved: ${vendorsData.length}`);

    // CRITICAL DEBUG: Enhanced vendor mapping check
    console.log('🔍 [vendorSummaryService] DETAILED VENDOR MAPPING CHECK:');
    uniqueVendorIds.forEach(vendorId => {
      const vendor = vendorsData.find(v => v.id === vendorId);
      const adjustmentCount = vendorAdjustmentCounts.get(vendorId) || 0;
      if (vendor) {
        console.log(`  ✅ ${vendorId} -> "${vendor.nome_loja}" (Status: ${vendor.status}) | ${adjustmentCount} adjustments`);
        if (vendor.nome_loja.includes('Mais Real')) {
          console.log(`  🎯 FOUND MAIS REAL: ID=${vendorId}, Name="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
        }
      } else {
        console.log(`  ❌ ${vendorId} -> NOT FOUND IN VENDORS DATA | ${adjustmentCount} adjustments`);
      }
    });

    // CRITICAL: Check specifically for "Mais Real"
    const maisRealVendor = vendorsData.find(v => v.nome_loja.includes('Mais Real'));
    if (maisRealVendor) {
      const maisRealAdjustments = allAdjustments.filter(adj => adj.vendedor_id === maisRealVendor.id);
      console.log(`🎉 [vendorSummaryService] MAIS REAL FOUND! ID: ${maisRealVendor.id}, Name: "${maisRealVendor.nome_loja}", Status: ${maisRealVendor.status}`);
      console.log(`🎉 [vendorSummaryService] MAIS REAL has ${maisRealAdjustments.length} adjustments`);
    } else {
      console.log('❌ [vendorSummaryService] MAIS REAL NOT FOUND IN VENDORS DATA!');
      console.log('🔍 [vendorSummaryService] Available vendor names:', vendorsData.map(v => v.nome_loja));
    }

    // Step 3: Process data with enhanced logging
    console.log('🔄 [vendorSummaryService] Starting data processing...');
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);

    // FINAL VERIFICATION
    console.log('🔍 [vendorSummaryService] === FINAL RESULT VERIFICATION ===');
    console.log(`📊 [vendorSummaryService] Final result contains ${result.length} vendor summaries:`);
    result.forEach((summary, index) => {
      console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments`);
      if (summary.vendedor_nome.includes('Mais Real')) {
        console.log(`  🎯 MAIS REAL IN FINAL RESULT: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
      }
    });

    // CRITICAL: Double-check if Mais Real is in the final result
    const maisRealInResult = result.find(r => r.vendedor_nome.includes('Mais Real'));
    if (maisRealInResult) {
      console.log(`🎉 [vendorSummaryService] SUCCESS! Mais Real found in final result with ${maisRealInResult.total_ajustes} adjustments`);
    } else {
      console.log('❌ [vendorSummaryService] CRITICAL ERROR: Mais Real NOT found in final result despite having adjustments!');
      
      // Emergency debugging: Show what happened to Mais Real
      const maisRealVendorId = vendorsData.find(v => v.nome_loja.includes('Mais Real'))?.id;
      if (maisRealVendorId) {
        const maisRealAdjustments = allAdjustments.filter(adj => adj.vendedor_id === maisRealVendorId);
        console.log(`🔍 [vendorSummaryService] EMERGENCY DEBUG: Mais Real ID ${maisRealVendorId} has ${maisRealAdjustments.length} adjustments`);
        console.log('🔍 [vendorSummaryService] Mais Real adjustments:', maisRealAdjustments.slice(0, 3));
      }
    }

    console.log('🔍 [vendorSummaryService] === ENDING ENHANCED VENDOR ADJUSTMENTS SUMMARY ===');
    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] Error in getVendorAdjustmentsSummary:', error);
    toast.error('Erro ao buscar resumo de ajustes por vendedor');
    return [];
  }
};
