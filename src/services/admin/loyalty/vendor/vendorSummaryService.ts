
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('🔍 [vendorSummaryService] === ENHANCED VENDOR ADJUSTMENTS SUMMARY ===');
    console.log('🔍 [vendorSummaryService] Timestamp:', new Date().toISOString());

    // Step 1: Get ALL adjustments with enhanced error handling
    console.log('📊 [vendorSummaryService] Step 1: Fetching all adjustments...');
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.log('⚠️ [vendorSummaryService] No adjustments found');
      return [];
    }

    console.log(`📊 [vendorSummaryService] Found ${allAdjustments.length} total adjustments`);
    
    // ENHANCED: Detailed adjustment distribution analysis
    const vendorAdjustmentCounts = new Map<string, number>();
    const adjustmentsByVendor = new Map<string, typeof allAdjustments>();
    
    allAdjustments.forEach(adj => {
      const count = vendorAdjustmentCounts.get(adj.vendedor_id) || 0;
      vendorAdjustmentCounts.set(adj.vendedor_id, count + 1);
      
      if (!adjustmentsByVendor.has(adj.vendedor_id)) {
        adjustmentsByVendor.set(adj.vendedor_id, []);
      }
      adjustmentsByVendor.get(adj.vendedor_id)?.push(adj);
    });

    console.log('🔍 [vendorSummaryService] ENHANCED adjustments by vendor ID:');
    Array.from(vendorAdjustmentCounts.entries()).forEach(([vendorId, count]) => {
      console.log(`  - ${vendorId}: ${count} adjustments`);
      
      // Log sample adjustments for debugging
      const sampleAdjs = adjustmentsByVendor.get(vendorId)?.slice(0, 2);
      sampleAdjs?.forEach((adj, idx) => {
        console.log(`    Sample ${idx + 1}: ${adj.tipo} ${adj.valor} pts - "${adj.motivo}"`);
      });
    });

    // Step 2: Get unique vendor IDs and fetch vendor data
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log(`🔍 [vendorSummaryService] Step 2: Fetching vendor data for ${uniqueVendorIds.length} unique vendors`);
    console.log(`  Vendor IDs: ${uniqueVendorIds.join(', ')}`);

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.error('❌ [vendorSummaryService] CRITICAL: No vendors found for adjustments!');
      console.log('   This means we have adjustments but no corresponding vendor records');
      console.log('   Adjustment vendor IDs:', uniqueVendorIds);
      return [];
    }

    console.log(`🏪 [vendorSummaryService] Retrieved ${vendorsData.length} vendors`);

    // ENHANCED: Comprehensive vendor mapping verification
    console.log('🔍 [vendorSummaryService] ENHANCED VENDOR MAPPING VERIFICATION:');
    
    const foundVendorIds = new Set(vendorsData.map(v => v.id));
    const missingVendorIds = uniqueVendorIds.filter(id => !foundVendorIds.has(id));
    
    if (missingVendorIds.length > 0) {
      console.error('🚨 [vendorSummaryService] CRITICAL DATA INTEGRITY ISSUE!');
      console.error(`   ${missingVendorIds.length} vendor(s) have adjustments but no vendor record:`);
      missingVendorIds.forEach(missingId => {
        const adjustmentCount = vendorAdjustmentCounts.get(missingId) || 0;
        console.error(`   - Vendor ID ${missingId}: ${adjustmentCount} adjustments will be LOST`);
      });
    }
    
    uniqueVendorIds.forEach(vendorId => {
      const vendor = vendorsData.find(v => v.id === vendorId);
      const adjustmentCount = vendorAdjustmentCounts.get(vendorId) || 0;
      
      if (vendor) {
        console.log(`  ✅ ${vendorId} -> "${vendor.nome_loja}" (Status: ${vendor.status}) | ${adjustmentCount} adjustments`);
        
        const nameLower = vendor.nome_loja?.toLowerCase().trim() || '';
        if (nameLower.includes('mais real')) {
          console.log(`    🎯 MAIS REAL CONFIRMED: ID=${vendorId}, Name="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
        }
        if (nameLower.includes('beaba')) {
          console.log(`    🎯 BEABA CONFIRMED: ID=${vendorId}, Name="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
        }
      } else {
        console.error(`  ❌ ${vendorId} -> NOT FOUND | ${adjustmentCount} adjustments WILL BE LOST`);
      }
    });

    // Step 3: Process data with enhanced error handling and validation
    console.log('🔄 [vendorSummaryService] Step 3: Processing summary data...');
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);

    // ENHANCED FINAL VERIFICATION with comprehensive analysis
    console.log('🔍 [vendorSummaryService] === ENHANCED FINAL RESULT VERIFICATION ===');
    console.log(`📊 [vendorSummaryService] Result contains ${result.length} vendor summaries`);
    
    // Calculate expected vs actual totals
    const totalAdjustmentsExpected = allAdjustments.length;
    const totalAdjustmentsInResult = result.reduce((sum, r) => sum + r.total_ajustes, 0);
    const dataLossPercentage = ((totalAdjustmentsExpected - totalAdjustmentsInResult) / totalAdjustmentsExpected * 100).toFixed(2);
    
    console.log(`📊 [vendorSummaryService] Data integrity analysis:`);
    console.log(`  - Expected adjustments: ${totalAdjustmentsExpected}`);
    console.log(`  - Adjustments in result: ${totalAdjustmentsInResult}`);
    console.log(`  - Data loss: ${totalAdjustmentsExpected - totalAdjustmentsInResult} adjustments (${dataLossPercentage}%)`);
    
    result.forEach((summary, index) => {
      console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments`);
      console.log(`      Points: +${summary.pontos_adicionados}, -${summary.pontos_removidos}`);
      console.log(`      Last adjustment: ${summary.ultimo_ajuste}`);
      
      const nameLower = summary.vendedor_nome.toLowerCase().trim();
      if (nameLower.includes('mais real')) {
        console.log(`    🎉 MAIS REAL IN FINAL RESULT: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
      }
      if (nameLower.includes('beaba')) {
        console.log(`    🎉 BEABA IN FINAL RESULT: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
      }
    });

    // CRITICAL: Verify both key vendors are present with detailed diagnostics
    const maisRealInResult = result.find(r => r.vendedor_nome.toLowerCase().includes('mais real'));
    const beabaInResult = result.find(r => r.vendedor_nome.toLowerCase().includes('beaba'));
    
    console.log('🎯 [vendorSummaryService] KEY VENDORS VERIFICATION:');
    
    if (maisRealInResult && beabaInResult) {
      console.log(`🎉 [vendorSummaryService] SUCCESS: Both key vendors found in result`);
      console.log(`  - Mais Real: ${maisRealInResult.total_ajustes} adjustments (+${maisRealInResult.pontos_adicionados} points)`);
      console.log(`  - Beaba: ${beabaInResult.total_ajustes} adjustments (+${beabaInResult.pontos_adicionados} points)`);
    } else {
      console.error('❌ [vendorSummaryService] CRITICAL: Missing key vendors in result');
      console.log(`  - Mais Real found: ${!!maisRealInResult}`);
      console.log(`  - Beaba found: ${!!beabaInResult}`);
      
      if (!maisRealInResult) {
        console.error('🔍 [vendorSummaryService] DEBUGGING: Why is Mais Real missing?');
        
        // Check if Mais Real vendor exists in vendors data
        const maisRealVendor = vendorsData.find(v => v.nome_loja?.toLowerCase().includes('mais real'));
        if (maisRealVendor) {
          const maisRealAdjustments = allAdjustments.filter(adj => adj.vendedor_id === maisRealVendor.id);
          console.log(`  - Mais Real vendor found: ${maisRealVendor.id} -> "${maisRealVendor.nome_loja}"`);
          console.log(`  - Mais Real adjustments in input: ${maisRealAdjustments.length}`);
          
          if (maisRealAdjustments.length > 0) {
            console.log(`  - Sample Mais Real adjustment:`, maisRealAdjustments[0]);
            console.log(`  - ERROR: Mais Real has adjustments but didn't make it to final result!`);
          }
        } else {
          console.log(`  - Mais Real vendor NOT FOUND in vendors data`);
          console.log(`  - Available vendor names:`, vendorsData.map(v => `"${v.nome_loja}"`));
        }
      }
    }

    console.log('🔍 [vendorSummaryService] === ENHANCED SUMMARY COMPLETE ===');
    
    // Show a warning if there's significant data loss
    if (totalAdjustmentsInResult < totalAdjustmentsExpected * 0.9) {
      console.error(`🚨 [vendorSummaryService] WARNING: Significant data loss detected (${dataLossPercentage}%)`);
      toast.error(`Aviso: ${dataLossPercentage}% dos ajustes foram perdidos no processamento`);
    }
    
    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] Error in getVendorAdjustmentsSummary:', error);
    toast.error('Erro ao buscar resumo de ajustes por vendedor');
    return [];
  }
};
