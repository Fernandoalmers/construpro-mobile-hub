
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[],
  limit?: number
): VendorAdjustment[] => {
  // Get unique vendor IDs from adjustments
  const vendorIdsInAdjustments = [...new Set(adjustments.map(adj => adj.vendedor_id))];
  console.log('🔍 [vendorDataProcessor] Unique vendor IDs in adjustments:', vendorIdsInAdjustments);
  console.log('🔍 [vendorDataProcessor] Number of unique vendors in adjustments:', vendorIdsInAdjustments.length);

  // CRITICAL FIX: Process adjustments for ALL found vendors regardless of status
  const vendorIds = new Set(vendors.map(v => v.id));
  const filteredAdjustments = adjustments.filter(adj => 
    vendorIds.has(adj.vendedor_id)
  );

  console.log(`📊 [vendorDataProcessor] ${filteredAdjustments.length} adjustments for found vendors`);
  console.log(`📊 [vendorDataProcessor] Vendors found: ${vendors.length}`);
  console.log(`📊 [vendorDataProcessor] Vendor names: ${vendors.map(v => v.nome_loja).join(', ')}`);
  
  // Group adjustments by vendor for detailed logging
  const adjustmentsByVendor = new Map<string, number>();
  filteredAdjustments.forEach(adj => {
    const count = adjustmentsByVendor.get(adj.vendedor_id) || 0;
    adjustmentsByVendor.set(adj.vendedor_id, count + 1);
  });

  console.log('📊 [vendorDataProcessor] Adjustments per vendor (processVendorAdjustments):');
  Array.from(adjustmentsByVendor.entries()).forEach(([vendorId, count]) => {
    const vendor = vendors.find(v => v.id === vendorId);
    console.log(`  - ${vendor?.nome_loja || vendorId} (${vendor?.status}): ${count} adjustments`);
  });

  // Create lookup maps
  const vendorNameMap = new Map(vendors.map(v => [v.id, v.nome_loja]));
  const userMap = new Map(users.map(u => [u.id, u.nome]) || []);

  const result: VendorAdjustment[] = filteredAdjustments.map(adjustment => ({
    ...adjustment,
    vendedor_nome: vendorNameMap.get(adjustment.vendedor_id) || 'Vendedor desconhecido',
    usuario_nome: userMap.get(adjustment.usuario_id) || 'Usuário desconhecido'
  }));

  console.log(`✅ [vendorDataProcessor] Returning ${result.length} processed adjustments`);
  console.log(`✅ [vendorDataProcessor] Unique vendors in result: ${[...new Set(result.map(r => r.vendedor_nome))].join(', ')}`);
  
  // Apply limit only for display purposes if specified
  const finalResult = limit ? result.slice(0, limit) : result;
  console.log(`📋 [vendorDataProcessor] Final result after limit (${limit || 'no limit'}): ${finalResult.length} adjustments`);
  
  return finalResult;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log('🔍 [vendorDataProcessor] Processing adjustments data for summary...');
  console.log(`🔍 [vendorDataProcessor] Total adjustments to process: ${adjustments.length}`);
  console.log(`🔍 [vendorDataProcessor] Total vendors available: ${vendors.length}`);
  
  // Create vendor lookup map
  const vendorMap = new Map(vendors.map(v => [v.id, v]));

  // CRITICAL DEBUG: Log all vendors
  console.log('🏪 [vendorDataProcessor] Available vendors:');
  vendors.forEach(vendor => {
    console.log(`  - ${vendor.nome_loja} (ID: ${vendor.id}, Status: ${vendor.status})`);
  });

  // Process and aggregate adjustments by vendor
  const vendorStatsMap = new Map<string, {
    vendedor_nome: string;
    total_ajustes: number;
    pontos_adicionados: number;
    pontos_removidos: number;
    ultimo_ajuste: string;
  }>();

  adjustments.forEach((adjustment, index) => {
    const vendorId = adjustment.vendedor_id;
    const vendor = vendorMap.get(vendorId);
    
    if (!vendor) {
      console.log(`⚠️ [vendorDataProcessor] Vendor not found for adjustment ${index + 1}, vendorId: ${vendorId}`);
      return;
    }

    if (!vendorStatsMap.has(vendorId)) {
      vendorStatsMap.set(vendorId, {
        vendedor_nome: vendor.nome_loja,
        total_ajustes: 0,
        pontos_adicionados: 0,
        pontos_removidos: 0,
        ultimo_ajuste: adjustment.created_at
      });
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

    console.log(`  ✓ Processed adjustment for ${vendor.nome_loja}: ${adjustment.tipo} ${adjustment.valor} pts`);
  });

  // Convert to array and sort by total adjustments
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: stats.vendedor_nome,
    total_ajustes: stats.total_ajustes,
    pontos_adicionados: stats.pontos_adicionados,
    pontos_removidos: stats.pontos_removidos,
    ultimo_ajuste: stats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ [vendorDataProcessor] CORRECTED SUMMARY RESULT - Returning ${result.length} vendor summaries:`);
  result.forEach((v, index) => {
    console.log(`  ${index + 1}. ✓ ${v.vendedor_nome} (ID: ${v.vendedor_id}): ${v.total_ajustes} ajustes (+${v.pontos_adicionados}, -${v.pontos_removidos})`);
  });

  // CRITICAL: Verify "Mais Real Unid. Planalto" is included
  const maisRealVendor = result.find(v => v.vendedor_nome === 'Mais Real Unid. Planalto');
  if (maisRealVendor) {
    console.log(`🎉 [vendorDataProcessor] SUCCESS! "Mais Real Unid. Planalto" found with ${maisRealVendor.total_ajustes} adjustments and +${maisRealVendor.pontos_adicionados} points`);
  } else {
    console.log('❌ [vendorDataProcessor] WARNING: "Mais Real Unid. Planalto" not found in results');
  }

  return result;
};
