
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[]
): VendorAdjustment[] => {
  console.log('🔍 [vendorDataProcessor] === ENHANCED PROCESSING START ===');
  console.log(`📊 [vendorDataProcessor] Input: ${adjustments.length} adjustments, ${vendors.length} vendors, ${users.length} users`);
  
  // Enhanced debugging: Log all input data
  console.log('🏪 [vendorDataProcessor] Available vendors:');
  vendors.forEach((vendor, index) => {
    console.log(`  ${index + 1}. "${vendor.nome_loja}" (ID: ${vendor.id}, Status: ${vendor.status})`);
  });
  
  console.log('📋 [vendorDataProcessor] Adjustments breakdown by vendor_id:');
  const adjustmentsByVendorId = new Map<string, number>();
  adjustments.forEach(adj => {
    const count = adjustmentsByVendorId.get(adj.vendedor_id) || 0;
    adjustmentsByVendorId.set(adj.vendedor_id, count + 1);
  });
  
  Array.from(adjustmentsByVendorId.entries()).forEach(([vendorId, count]) => {
    const vendor = vendors.find(v => v.id === vendorId);
    console.log(`  - ${vendorId}: ${count} adjustments ${vendor ? `(${vendor.nome_loja})` : '(VENDOR NOT FOUND)'}`);
  });

  // CRITICAL FIX: Create vendor and user lookup maps FIRST
  const vendorNameMap = new Map(vendors.map(v => [v.id, v.nome_loja]));
  const userMap = new Map(users.map(u => [u.id, u.nome]) || []);
  
  console.log('🗺️ [vendorDataProcessor] Vendor mapping created:');
  Array.from(vendorNameMap.entries()).forEach(([id, name]) => {
    console.log(`  - ${id} -> "${name}"`);
  });

  // CRITICAL FIX: Process ALL adjustments without filtering first
  console.log('🔄 [vendorDataProcessor] Processing ALL adjustments...');
  const result: VendorAdjustment[] = [];
  let processedCount = 0;
  let skippedCount = 0;

  adjustments.forEach((adjustment, index) => {
    const vendorName = vendorNameMap.get(adjustment.vendedor_id);
    const userName = userMap.get(adjustment.usuario_id);
    
    if (!vendorName) {
      console.log(`⚠️ [vendorDataProcessor] Adjustment ${index + 1}: No vendor found for ID ${adjustment.vendedor_id}`);
      skippedCount++;
      return;
    }
    
    if (!userName) {
      console.log(`⚠️ [vendorDataProcessor] Adjustment ${index + 1}: No user found for ID ${adjustment.usuario_id}`);
      // Still process but with fallback name
    }
    
    const processedAdjustment: VendorAdjustment = {
      ...adjustment,
      vendedor_nome: vendorName,
      usuario_nome: userName || 'Usuário desconhecido'
    };
    
    result.push(processedAdjustment);
    processedCount++;
    
    // Log progress for key vendors
    if (vendorName.includes('Mais Real') || vendorName.includes('Beaba')) {
      console.log(`✅ [vendorDataProcessor] Processed adjustment ${index + 1} for "${vendorName}": ${adjustment.tipo} ${adjustment.valor} pts`);
    }
  });

  console.log(`✅ [vendorDataProcessor] === PROCESSING COMPLETE ===`);
  console.log(`📊 [vendorDataProcessor] Processed: ${processedCount}, Skipped: ${skippedCount}, Total result: ${result.length}`);
  
  // Final verification: Check unique vendors in result
  const uniqueVendorsInResult = [...new Set(result.map(r => r.vendedor_nome))];
  console.log(`🏪 [vendorDataProcessor] Unique vendors in final result: ${uniqueVendorsInResult.join(', ')}`);
  
  // Special check for both key vendors
  const maisRealCount = result.filter(r => r.vendedor_nome.includes('Mais Real')).length;
  const beabaCount = result.filter(r => r.vendedor_nome.includes('Beaba')).length;
  console.log(`🎯 [vendorDataProcessor] Mais Real adjustments in result: ${maisRealCount}`);
  console.log(`🎯 [vendorDataProcessor] Beaba adjustments in result: ${beabaCount}`);
  
  if (maisRealCount === 0) {
    console.error('❌ [vendorDataProcessor] CRITICAL: Mais Real adjustments lost during processing!');
  }
  
  return result;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log('🔍 [vendorDataProcessor] === STARTING ENHANCED SUMMARY PROCESSING ===');
  console.log(`🔍 [vendorDataProcessor] Input: ${adjustments.length} adjustments, ${vendors.length} vendors`);
  
  // Create vendor lookup map
  const vendorMap = new Map(vendors.map(v => [v.id, v]));

  // ENHANCED DEBUG: Log all vendors with detailed info
  console.log('🏪 [vendorDataProcessor] DETAILED VENDOR INFO:');
  vendors.forEach((vendor, index) => {
    console.log(`  ${index + 1}. "${vendor.nome_loja}" (ID: ${vendor.id}, Status: ${vendor.status})`);
    if (vendor.nome_loja.includes('Mais Real')) {
      console.log(`    🎯 MAIS REAL VENDOR FOUND: ID=${vendor.id}, Status=${vendor.status}`);
    }
  });

  // Process and aggregate adjustments by vendor
  const vendorStatsMap = new Map<string, {
    vendedor_nome: string;
    total_ajustes: number;
    pontos_adicionados: number;
    pontos_removidos: number;
    ultimo_ajuste: string;
  }>();

  console.log('🔄 [vendorDataProcessor] Processing each adjustment...');
  let processedCount = 0;
  let maisRealProcessedCount = 0;

  adjustments.forEach((adjustment, index) => {
    const vendorId = adjustment.vendedor_id;
    const vendor = vendorMap.get(vendorId);
    
    if (!vendor) {
      console.log(`⚠️ [vendorDataProcessor] Adjustment ${index + 1}: Vendor not found for vendorId: ${vendorId}`);
      return;
    }

    // Track Mais Real specifically
    if (vendor.nome_loja.includes('Mais Real')) {
      maisRealProcessedCount++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real adjustment ${maisRealProcessedCount}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }

    if (!vendorStatsMap.has(vendorId)) {
      vendorStatsMap.set(vendorId, {
        vendedor_nome: vendor.nome_loja,
        total_ajustes: 0,
        pontos_adicionados: 0,
        pontos_removidos: 0,
        ultimo_ajuste: adjustment.created_at
      });
      console.log(`📝 [vendorDataProcessor] Created new stats entry for: ${vendor.nome_loja}`);
    }

    const stats = vendorStatsMap.get(vendorId)!;
    
    // Increment total adjustments
    stats.total_ajustes += 1;
    
    // Add to appropriate points category
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

  console.log(`✅ [vendorDataProcessor] Processed ${processedCount} adjustments total`);
  console.log(`🎯 [vendorDataProcessor] Processed ${maisRealProcessedCount} Mais Real adjustments`);

  // Convert to array and sort by total adjustments
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: stats.vendedor_nome,
    total_ajustes: stats.total_ajustes,
    pontos_adicionados: stats.pontos_adicionados,
    pontos_removidos: stats.pontos_removidos,
    ultimo_ajuste: stats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ [vendorDataProcessor] === FINAL PROCESSING RESULT ===`);
  console.log(`📊 [vendorDataProcessor] Returning ${result.length} vendor summaries:`);
  result.forEach((v, index) => {
    console.log(`  ${index + 1}. "${v.vendedor_nome}" (ID: ${v.vendedor_id}): ${v.total_ajustes} adjustments (+${v.pontos_adicionados}, -${v.pontos_removidos})`);
    if (v.vendedor_nome.includes('Mais Real')) {
      console.log(`    🎉 MAIS REAL IN FINAL RESULT: ${v.total_ajustes} adjustments, +${v.pontos_adicionados} points`);
    }
  });

  // FINAL VERIFICATION: Check if Mais Real is in the result
  const maisRealInResult = result.find(v => v.vendedor_nome.includes('Mais Real'));
  if (maisRealInResult) {
    console.log(`🎉 [vendorDataProcessor] SUCCESS! Mais Real found in final result: ${maisRealInResult.total_ajustes} adjustments`);
  } else {
    console.log('❌ [vendorDataProcessor] CRITICAL ERROR: Mais Real NOT found in final result!');
    console.log('🔍 [vendorDataProcessor] Debugging: vendorStatsMap contents:');
    Array.from(vendorStatsMap.entries()).forEach(([id, stats]) => {
      console.log(`  - ${id}: ${stats.vendedor_nome} (${stats.total_ajustes} adjustments)`);
    });
  }

  return result;
};
