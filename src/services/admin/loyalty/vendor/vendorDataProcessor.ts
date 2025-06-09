
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[]
): VendorAdjustment[] => {
  console.log('🔍 [vendorDataProcessor] === ENHANCED PROCESSING START ===');
  console.log(`📊 [vendorDataProcessor] Input: ${adjustments.length} adjustments, ${vendors.length} vendors, ${users.length} users`);
  
  // ENHANCED: Create robust vendor and user lookup maps with detailed logging
  const vendorNameMap = new Map<string, string>();
  const userMap = new Map<string, string>();
  
  // Build vendor map with enhanced logging and error detection
  vendors.forEach((vendor, index) => {
    if (!vendor.id || !vendor.nome_loja) {
      console.error(`❌ [vendorDataProcessor] Invalid vendor at index ${index}:`, vendor);
      return;
    }
    
    vendorNameMap.set(vendor.id, vendor.nome_loja);
    console.log(`🏪 [vendorDataProcessor] Vendor ${index + 1}: ID=${vendor.id} -> "${vendor.nome_loja}" (Status: ${vendor.status})`);
    
    // Enhanced detection for key vendors
    const nameLower = vendor.nome_loja.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`🎯 [vendorDataProcessor] MAIS REAL VENDOR MAPPED: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`🎯 [vendorDataProcessor] BEABA VENDOR MAPPED: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });
  
  // Build user map with error detection
  users.forEach((user, index) => {
    if (!user.id) {
      console.error(`❌ [vendorDataProcessor] Invalid user at index ${index}:`, user);
      return;
    }
    userMap.set(user.id, user.nome || 'Usuário sem nome');
  });
  
  console.log(`🗺️ [vendorDataProcessor] Created vendor map with ${vendorNameMap.size} entries`);
  console.log(`🗺️ [vendorDataProcessor] Created user map with ${userMap.size} entries`);

  // ENHANCED: Process ALL adjustments with comprehensive error handling and tracking
  const result: VendorAdjustment[] = [];
  const processingStats = {
    processed: 0,
    skipped: 0,
    missingVendor: 0,
    missingUser: 0,
    maisRealProcessed: 0,
    beabaProcessed: 0
  };
  
  const vendorProcessingCounts = new Map<string, number>();

  adjustments.forEach((adjustment, index) => {
    console.log(`🔄 [vendorDataProcessor] Processing adjustment ${index + 1}/${adjustments.length}:`);
    console.log(`    ID: ${adjustment.id}, Vendor: ${adjustment.vendedor_id}, User: ${adjustment.usuario_id}`);
    console.log(`    Type: ${adjustment.tipo}, Value: ${adjustment.valor}, Reason: ${adjustment.motivo}`);
    
    const vendorName = vendorNameMap.get(adjustment.vendedor_id);
    const userName = userMap.get(adjustment.usuario_id);
    
    if (!vendorName) {
      console.error(`❌ [vendorDataProcessor] CRITICAL: No vendor found for ID ${adjustment.vendedor_id} - SKIPPING`);
      console.log(`🔍 [vendorDataProcessor] Available vendor IDs: ${Array.from(vendorNameMap.keys()).join(', ')}`);
      processingStats.skipped++;
      processingStats.missingVendor++;
      return;
    }
    
    if (!userName) {
      console.warn(`⚠️ [vendorDataProcessor] No user found for ID ${adjustment.usuario_id} - using fallback`);
      processingStats.missingUser++;
    }
    
    // Track vendor processing
    const currentCount = vendorProcessingCounts.get(adjustment.vendedor_id) || 0;
    vendorProcessingCounts.set(adjustment.vendedor_id, currentCount + 1);
    
    // Enhanced tracking for key vendors
    const vendorNameLower = vendorName.toLowerCase().trim();
    if (vendorNameLower.includes('mais real')) {
      processingStats.maisRealProcessed++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real adjustment ${processingStats.maisRealProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    if (vendorNameLower.includes('beaba')) {
      processingStats.beabaProcessed++;
      console.log(`🎯 [vendorDataProcessor] Processing Beaba adjustment ${processingStats.beabaProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    
    const processedAdjustment: VendorAdjustment = {
      ...adjustment,
      vendedor_nome: vendorName,
      usuario_nome: userName || 'Usuário desconhecido'
    };
    
    result.push(processedAdjustment);
    processingStats.processed++;
    
    console.log(`✅ [vendorDataProcessor] Successfully processed: "${vendorName}" (${adjustment.tipo}: ${adjustment.valor})`);
  });

  console.log(`✅ [vendorDataProcessor] === ENHANCED PROCESSING COMPLETE ===`);
  console.log(`📊 [vendorDataProcessor] Statistics:`, processingStats);
  
  // Enhanced vendor processing analysis
  console.log(`📊 [vendorDataProcessor] Vendor processing breakdown:`);
  Array.from(vendorProcessingCounts.entries()).forEach(([vendorId, count]) => {
    const vendorName = vendorNameMap.get(vendorId);
    console.log(`  - ${vendorName} (${vendorId}): ${count} adjustments processed`);
  });
  
  // FINAL VERIFICATION: Ensure data integrity with detailed analysis
  const uniqueVendorsInResult = [...new Set(result.map(r => r.vendedor_nome))];
  console.log(`🏪 [vendorDataProcessor] Unique vendors in final result (${uniqueVendorsInResult.length}): ${uniqueVendorsInResult.join(', ')}`);
  
  // CRITICAL: Verify both key vendors are present with detailed analysis
  const maisRealInResult = result.filter(r => r.vendedor_nome.toLowerCase().includes('mais real'));
  const beabaInResult = result.filter(r => r.vendedor_nome.toLowerCase().includes('beaba'));
  
  console.log(`🎯 [vendorDataProcessor] ENHANCED final verification:`);
  console.log(`  - Mais Real: ${maisRealInResult.length} adjustments (Expected: ${processingStats.maisRealProcessed})`);
  console.log(`  - Beaba: ${beabaInResult.length} adjustments (Expected: ${processingStats.beabaProcessed})`);
  
  if (maisRealInResult.length === 0 && processingStats.maisRealProcessed === 0) {
    console.log('⚠️ [vendorDataProcessor] Mais Real has no adjustments in the dataset');
  } else if (maisRealInResult.length === 0) {
    console.error('❌ [vendorDataProcessor] CRITICAL ERROR: Mais Real data lost during processing!');
    console.log('🔍 [vendorDataProcessor] Debug info for Mais Real:');
    
    // Find Mais Real vendor ID and check for adjustments
    const maisRealVendor = vendors.find(v => v.nome_loja?.toLowerCase().includes('mais real'));
    if (maisRealVendor) {
      const maisRealAdjustments = adjustments.filter(adj => adj.vendedor_id === maisRealVendor.id);
      console.log(`  - Mais Real vendor: ${maisRealVendor.id} -> "${maisRealVendor.nome_loja}"`);
      console.log(`  - Mais Real adjustments in input: ${maisRealAdjustments.length}`);
      
      if (maisRealAdjustments.length > 0) {
        console.log(`  - Sample Mais Real adjustment:`, maisRealAdjustments[0]);
      }
    } else {
      console.log(`  - Mais Real vendor not found in vendors list`);
    }
  } else {
    console.log(`🎉 [vendorDataProcessor] SUCCESS: Mais Real data preserved!`);
  }
  
  return result;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log('🔍 [vendorDataProcessor] === ENHANCED SUMMARY PROCESSING START ===');
  console.log(`📊 [vendorDataProcessor] Input: ${adjustments.length} adjustments, ${vendors.length} vendors`);
  
  // ENHANCED: Create robust vendor lookup map with detailed error detection
  const vendorMap = new Map<string, any>();
  const vendorIdToName = new Map<string, string>();
  
  vendors.forEach((vendor, index) => {
    if (!vendor.id || !vendor.nome_loja) {
      console.error(`❌ [vendorDataProcessor] Invalid vendor for summary at index ${index}:`, vendor);
      return;
    }
    
    vendorMap.set(vendor.id, vendor);
    vendorIdToName.set(vendor.id, vendor.nome_loja);
    console.log(`🏪 [vendorDataProcessor] Summary vendor mapped: ${vendor.id} -> "${vendor.nome_loja}" (Status: ${vendor.status})`);
    
    const nameLower = vendor.nome_loja.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`🎯 [vendorDataProcessor] MAIS REAL VENDOR MAPPED FOR SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`🎯 [vendorDataProcessor] BEABA VENDOR MAPPED FOR SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });

  // ENHANCED: Process and aggregate with comprehensive tracking
  const vendorStatsMap = new Map<string, {
    vendedor_nome: string;
    total_ajustes: number;
    pontos_adicionados: number;
    pontos_removidos: number;
    ultimo_ajuste: string;
  }>();
  
  const processingStats = {
    processed: 0,
    skipped: 0,
    missingVendor: 0,
    maisRealAdjustments: 0,
    beabaAdjustments: 0
  };
  
  console.log('🔄 [vendorDataProcessor] Processing adjustments for summary...');
  
  adjustments.forEach((adjustment, index) => {
    const vendorId = adjustment.vendedor_id;
    const vendor = vendorMap.get(vendorId);
    
    console.log(`🔄 [vendorDataProcessor] Summary processing adjustment ${index + 1}: vendedor_id=${vendorId}`);
    
    if (!vendor) {
      console.error(`❌ [vendorDataProcessor] CRITICAL: Vendor not found for vendorId: ${vendorId}`);
      console.log(`🔍 [vendorDataProcessor] Available vendor IDs: ${Array.from(vendorMap.keys()).join(', ')}`);
      console.log(`🔍 [vendorDataProcessor] This adjustment will be LOST:`, adjustment);
      processingStats.skipped++;
      processingStats.missingVendor++;
      return;
    }

    // Enhanced tracking for key vendors
    const vendorNameLower = vendor.nome_loja.toLowerCase().trim();
    if (vendorNameLower.includes('mais real')) {
      processingStats.maisRealAdjustments++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real summary adjustment ${processingStats.maisRealAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    if (vendorNameLower.includes('beaba')) {
      processingStats.beabaAdjustments++;
      console.log(`🎯 [vendorDataProcessor] Processing Beaba summary adjustment ${processingStats.beabaAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
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
      console.log(`📝 [vendorDataProcessor] Created new summary stats entry for: "${vendor.nome_loja}"`);
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

    processingStats.processed++;
    
    if (vendorNameLower.includes('mais real')) {
      console.log(`🎯 [vendorDataProcessor] Mais Real summary stats updated: ${stats.total_ajustes} total, +${stats.pontos_adicionados}, -${stats.pontos_removidos}`);
    }
    if (vendorNameLower.includes('beaba')) {
      console.log(`🎯 [vendorDataProcessor] Beaba summary stats updated: ${stats.total_ajustes} total, +${stats.pontos_adicionados}, -${stats.pontos_removidos}`);
    }
  });

  console.log(`✅ [vendorDataProcessor] Summary processing complete:`, processingStats);

  // Convert to array and sort
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: stats.vendedor_nome,
    total_ajustes: stats.total_ajustes,
    pontos_adicionados: stats.pontos_adicionados,
    pontos_removidos: stats.pontos_removidos,
    ultimo_ajuste: stats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ [vendorDataProcessor] === ENHANCED SUMMARY RESULT ===`);
  console.log(`📊 [vendorDataProcessor] Returning ${result.length} vendor summaries:`);
  
  result.forEach((summary, index) => {
    console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments (+${summary.pontos_adicionados}, -${summary.pontos_removidos})`);
    
    const nameLower = summary.vendedor_nome.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`    🎉 MAIS REAL IN FINAL SUMMARY: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`    🎉 BEABA IN FINAL SUMMARY: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
    }
  });

  // ENHANCED FINAL VERIFICATION with detailed error reporting
  const maisRealInResult = result.find(v => v.vendedor_nome.toLowerCase().includes('mais real'));
  const beabaInResult = result.find(v => v.vendedor_nome.toLowerCase().includes('beaba'));
  
  console.log(`🎯 [vendorDataProcessor] ENHANCED summary verification:`);
  console.log(`  - Mais Real in result: ${!!maisRealInResult}`);
  console.log(`  - Beaba in result: ${!!beabaInResult}`);
  
  if (maisRealInResult) {
    console.log(`🎉 [vendorDataProcessor] SUCCESS: Mais Real found in summary result: ${maisRealInResult.total_ajustes} adjustments`);
  } else {
    console.error('❌ [vendorDataProcessor] CRITICAL ERROR: Mais Real NOT found in summary result!');
    
    // Enhanced debugging information
    console.log('🔍 [vendorDataProcessor] Enhanced debug - vendorStatsMap contents:');
    Array.from(vendorStatsMap.entries()).forEach(([id, stats]) => {
      console.log(`  - ${id}: ${stats.vendedor_nome} (${stats.total_ajustes} adjustments)`);
    });
    
    console.log('🔍 [vendorDataProcessor] Enhanced debug - original vendors:');
    vendors.forEach(v => {
      console.log(`  - ${v.id}: "${v.nome_loja}" (includes mais real: ${v.nome_loja?.toLowerCase().includes('mais real')})`);
    });
    
    console.log('🔍 [vendorDataProcessor] Enhanced debug - adjustments by vendor:');
    const adjustmentsByVendor = new Map<string, number>();
    adjustments.forEach(adj => {
      const count = adjustmentsByVendor.get(adj.vendedor_id) || 0;
      adjustmentsByVendor.set(adj.vendedor_id, count + 1);
    });
    Array.from(adjustmentsByVendor.entries()).forEach(([vendorId, count]) => {
      const vendorName = vendorIdToName.get(vendorId) || 'UNKNOWN';
      console.log(`  - ${vendorId} (${vendorName}): ${count} adjustments`);
    });
  }

  return result;
};
