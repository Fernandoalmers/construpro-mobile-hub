
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[]
): VendorAdjustment[] => {
  console.log('🔍 [vendorDataProcessor] === FIXED PROCESSING START ===');
  console.log(`📊 [vendorDataProcessor] Input: ${adjustments.length} adjustments, ${vendors.length} vendors, ${users.length} users`);
  
  // CRITICAL FIX: Create robust vendor and user lookup maps
  const vendorNameMap = new Map<string, string>();
  const userMap = new Map<string, string>();
  
  // Build vendor map with detailed logging
  vendors.forEach((vendor, index) => {
    vendorNameMap.set(vendor.id, vendor.nome_loja);
    console.log(`🏪 [vendorDataProcessor] Vendor ${index + 1}: ID=${vendor.id} -> "${vendor.nome_loja}" (Status: ${vendor.status})`);
    
    if (vendor.nome_loja.includes('Mais Real')) {
      console.log(`🎯 [vendorDataProcessor] MAIS REAL VENDOR MAPPED: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });
  
  // Build user map
  users.forEach(user => {
    userMap.set(user.id, user.nome);
  });
  
  console.log(`🗺️ [vendorDataProcessor] Created vendor map with ${vendorNameMap.size} entries`);
  console.log(`🗺️ [vendorDataProcessor] Created user map with ${userMap.size} entries`);

  // CRITICAL FIX: Process ALL adjustments with better error handling
  const result: VendorAdjustment[] = [];
  let processedCount = 0;
  let skippedCount = 0;
  let maisRealProcessed = 0;

  adjustments.forEach((adjustment, index) => {
    const vendorName = vendorNameMap.get(adjustment.vendedor_id);
    const userName = userMap.get(adjustment.usuario_id);
    
    // ENHANCED: Log each processing step for debugging
    console.log(`🔄 [vendorDataProcessor] Processing adjustment ${index + 1}/${adjustments.length}: vendedor_id=${adjustment.vendedor_id}`);
    
    if (!vendorName) {
      console.log(`❌ [vendorDataProcessor] CRITICAL: No vendor found for ID ${adjustment.vendedor_id} - SKIPPING`);
      console.log(`🔍 [vendorDataProcessor] Available vendor IDs: ${Array.from(vendorNameMap.keys()).join(', ')}`);
      skippedCount++;
      return;
    }
    
    // Track Mais Real specifically
    if (vendorName.includes('Mais Real')) {
      maisRealProcessed++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real adjustment ${maisRealProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    
    const processedAdjustment: VendorAdjustment = {
      ...adjustment,
      vendedor_nome: vendorName,
      usuario_nome: userName || 'Usuário desconhecido'
    };
    
    result.push(processedAdjustment);
    processedCount++;
    
    console.log(`✅ [vendorDataProcessor] Successfully processed: "${vendorName}" (${adjustment.tipo}: ${adjustment.valor})`);
  });

  console.log(`✅ [vendorDataProcessor] === PROCESSING COMPLETE ===`);
  console.log(`📊 [vendorDataProcessor] Total processed: ${processedCount}, Skipped: ${skippedCount}`);
  console.log(`🎯 [vendorDataProcessor] Mais Real adjustments processed: ${maisRealProcessed}`);
  
  // FINAL VERIFICATION: Ensure data integrity
  const uniqueVendorsInResult = [...new Set(result.map(r => r.vendedor_nome))];
  console.log(`🏪 [vendorDataProcessor] Unique vendors in final result (${uniqueVendorsInResult.length}): ${uniqueVendorsInResult.join(', ')}`);
  
  // CRITICAL: Verify both key vendors are present
  const maisRealInResult = result.filter(r => r.vendedor_nome.includes('Mais Real'));
  const beabaInResult = result.filter(r => r.vendedor_nome.includes('Beaba'));
  
  console.log(`🎯 [vendorDataProcessor] Final verification:`);
  console.log(`  - Mais Real: ${maisRealInResult.length} adjustments`);
  console.log(`  - Beaba: ${beabaInResult.length} adjustments`);
  
  if (maisRealInResult.length === 0) {
    console.error('❌ [vendorDataProcessor] CRITICAL ERROR: Mais Real data lost!');
    console.log('🔍 [vendorDataProcessor] Debug info:');
    console.log('  - Original adjustments with Mais Real vendor_id:');
    adjustments.forEach(adj => {
      const vendor = vendors.find(v => v.id === adj.vendedor_id);
      if (vendor && vendor.nome_loja.includes('Mais Real')) {
        console.log(`    * Adjustment: ${adj.id} -> vendedor_id: ${adj.vendedor_id} (${vendor.nome_loja})`);
      }
    });
  } else {
    console.log(`🎉 [vendorDataProcessor] SUCCESS: Mais Real data preserved!`);
  }
  
  return result;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log('🔍 [vendorDataProcessor] === FIXED SUMMARY PROCESSING START ===');
  console.log(`📊 [vendorDataProcessor] Input: ${adjustments.length} adjustments, ${vendors.length} vendors`);
  
  // CRITICAL FIX: Create robust vendor lookup map
  const vendorMap = new Map<string, any>();
  vendors.forEach(vendor => {
    vendorMap.set(vendor.id, vendor);
    console.log(`🏪 [vendorDataProcessor] Vendor mapped: ${vendor.id} -> "${vendor.nome_loja}" (Status: ${vendor.status})`);
    
    if (vendor.nome_loja.includes('Mais Real')) {
      console.log(`🎯 [vendorDataProcessor] MAIS REAL VENDOR MAPPED FOR SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });

  // ENHANCED: Process and aggregate with better tracking
  const vendorStatsMap = new Map<string, {
    vendedor_nome: string;
    total_ajustes: number;
    pontos_adicionados: number;
    pontos_removidos: number;
    ultimo_ajuste: string;
  }>();

  console.log('🔄 [vendorDataProcessor] Processing adjustments for summary...');
  let processedCount = 0;
  let maisRealAdjustments = 0;

  adjustments.forEach((adjustment, index) => {
    const vendorId = adjustment.vendedor_id;
    const vendor = vendorMap.get(vendorId);
    
    console.log(`🔄 [vendorDataProcessor] Processing adjustment ${index + 1}: vendedor_id=${vendorId}`);
    
    if (!vendor) {
      console.log(`❌ [vendorDataProcessor] CRITICAL: Vendor not found for vendorId: ${vendorId}`);
      console.log(`🔍 [vendorDataProcessor] Available vendor IDs: ${Array.from(vendorMap.keys()).join(', ')}`);
      return;
    }

    // Track Mais Real specifically
    if (vendor.nome_loja.includes('Mais Real')) {
      maisRealAdjustments++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real summary adjustment ${maisRealAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }

    // Initialize or update vendor stats
    if (!vendorStatsMap.has(vendorId)) {
      vendorStatsMap.set(vendorId, {
        vendedor_nome: vendor.nome_loja,
        total_ajustes: 0,
        pontos_adicionados: 0,
        pontos_removidos: 0,
        ultimo_ajuste: adjustment.created_at
      });
      console.log(`📝 [vendorDataProcessor] Created new stats entry for: "${vendor.nome_loja}"`);
    }

    const stats = vendorStatsMap.get(vendorId)!;
    
    // Update stats
    stats.total_ajustes += 1;
    
    if (adjustment.tipo === 'adicao') {
      stats.pontos_adicionados += adjustment.valor;
    } else if (adjustment.tipo === 'remocao') {
      stats.pontos_removidos += Math.abs(adjustment.valor);
    }
    
    // Update latest adjustment date
    if (new Date(adjustment.created_at) > new Date(stats.ultimo_ajuste)) {
      stats.ultimo_ajuste = adjustment.created_at;
    }

    processedCount++;
    
    if (vendor.nome_loja.includes('Mais Real')) {
      console.log(`🎯 [vendorDataProcessor] Mais Real stats updated: ${stats.total_ajustes} total, +${stats.pontos_adicionados}, -${stats.pontos_removidos}`);
    }
  });

  console.log(`✅ [vendorDataProcessor] Summary processing complete: ${processedCount} adjustments processed`);
  console.log(`🎯 [vendorDataProcessor] Mais Real adjustments in summary: ${maisRealAdjustments}`);

  // Convert to array and sort
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: stats.vendedor_nome,
    total_ajustes: stats.total_ajustes,
    pontos_adicionados: stats.pontos_adicionados,
    pontos_removidos: stats.pontos_removidos,
    ultimo_ajuste: stats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ [vendorDataProcessor] === SUMMARY RESULT ===`);
  console.log(`📊 [vendorDataProcessor] Returning ${result.length} vendor summaries:`);
  
  result.forEach((summary, index) => {
    console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments (+${summary.pontos_adicionados}, -${summary.pontos_removidos})`);
    
    if (summary.vendedor_nome.includes('Mais Real')) {
      console.log(`    🎉 MAIS REAL IN FINAL SUMMARY: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
    }
  });

  // FINAL VERIFICATION
  const maisRealInResult = result.find(v => v.vendedor_nome.includes('Mais Real'));
  if (maisRealInResult) {
    console.log(`🎉 [vendorDataProcessor] SUCCESS: Mais Real found in summary result: ${maisRealInResult.total_ajustes} adjustments`);
  } else {
    console.error('❌ [vendorDataProcessor] CRITICAL ERROR: Mais Real NOT found in summary result!');
    
    // Debug information
    console.log('🔍 [vendorDataProcessor] Debug - vendorStatsMap contents:');
    Array.from(vendorStatsMap.entries()).forEach(([id, stats]) => {
      console.log(`  - ${id}: ${stats.vendedor_nome} (${stats.total_ajustes} adjustments)`);
    });
  }

  return result;
};
