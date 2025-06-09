
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[]
): VendorAdjustment[] => {
  console.log(`🔄 [vendorDataProcessor] Processing ${adjustments.length} adjustments with ${vendors.length} vendors`);
  
  if (!adjustments || adjustments.length === 0) {
    console.warn('⚠️ [vendorDataProcessor] No adjustments to process');
    return [];
  }

  if (!vendors || vendors.length === 0) {
    console.warn('⚠️ [vendorDataProcessor] No vendors to map');
    return [];
  }

  // Create lookup maps
  const vendorNameMap = new Map<string, string>();
  const userMap = new Map<string, string>();
  
  vendors.forEach((vendor) => {
    if (vendor.id && vendor.nome_loja) {
      vendorNameMap.set(vendor.id, vendor.nome_loja);
    }
  });
  
  users.forEach((user) => {
    if (user.id) {
      userMap.set(user.id, user.nome || 'Usuário sem nome');
    }
  });
  
  console.log(`🗺️ [vendorDataProcessor] Created maps: ${vendorNameMap.size} vendors, ${userMap.size} users`);

  // Process adjustments
  const result: VendorAdjustment[] = [];
  let skipped = 0;

  adjustments.forEach((adjustment) => {
    const vendorName = vendorNameMap.get(adjustment.vendedor_id);
    const userName = userMap.get(adjustment.usuario_id);
    
    if (!vendorName) {
      console.warn(`⚠️ [vendorDataProcessor] Vendor not found for ID ${adjustment.vendedor_id}`);
      skipped++;
      return;
    }
    
    const processedAdjustment: VendorAdjustment = {
      ...adjustment,
      vendedor_nome: vendorName,
      usuario_nome: userName || 'Usuário desconhecido'
    };
    
    result.push(processedAdjustment);
  });

  if (skipped > 0) {
    console.warn(`⚠️ [vendorDataProcessor] Skipped ${skipped} adjustments due to missing vendor data`);
  }

  console.log(`✅ [vendorDataProcessor] Successfully processed ${result.length} adjustments`);
  return result;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log(`📊 [vendorDataProcessor] Creating summary for ${adjustments.length} adjustments`);
  
  if (!adjustments || adjustments.length === 0) {
    console.warn('⚠️ [vendorDataProcessor] No adjustments for summary');
    return [];
  }

  if (!vendors || vendors.length === 0) {
    console.warn('⚠️ [vendorDataProcessor] No vendors for summary');
    return [];
  }
  
  // Create vendor lookup map
  const vendorMap = new Map<string, any>();
  vendors.forEach((vendor) => {
    if (vendor.id && vendor.nome_loja) {
      vendorMap.set(vendor.id, vendor);
    }
  });

  // Aggregate data by vendor
  const vendorStatsMap = new Map<string, {
    vendedor_nome: string;
    total_ajustes: number;
    pontos_adicionados: number;
    pontos_removidos: number;
    ultimo_ajuste: string;
  }>();
  
  let skipped = 0;
  
  adjustments.forEach((adjustment) => {
    const vendor = vendorMap.get(adjustment.vendedor_id);
    
    if (!vendor) {
      console.warn(`⚠️ [vendorDataProcessor] Vendor not found for ID: ${adjustment.vendedor_id}`);
      skipped++;
      return;
    }

    if (!vendorStatsMap.has(adjustment.vendedor_id)) {
      vendorStatsMap.set(adjustment.vendedor_id, {
        vendedor_nome: vendor.nome_loja,
        total_ajustes: 0,
        pontos_adicionados: 0,
        pontos_removidos: 0,
        ultimo_ajuste: adjustment.created_at
      });
    }

    const vendorStats = vendorStatsMap.get(adjustment.vendedor_id)!;
    
    vendorStats.total_ajustes += 1;
    
    if (adjustment.tipo === 'adicao') {
      vendorStats.pontos_adicionados += adjustment.valor;
    } else if (adjustment.tipo === 'remocao') {
      vendorStats.pontos_removidos += Math.abs(adjustment.valor);
    }
    
    if (new Date(adjustment.created_at) > new Date(vendorStats.ultimo_ajuste)) {
      vendorStats.ultimo_ajuste = adjustment.created_at;
    }
  });

  if (skipped > 0) {
    console.warn(`⚠️ [vendorDataProcessor] Skipped ${skipped} adjustments in summary due to missing vendor data`);
  }

  // Convert to array and sort by total adjustments
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, vendorStats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: vendorStats.vendedor_nome,
    total_ajustes: vendorStats.total_ajustes,
    pontos_adicionados: vendorStats.pontos_adicionados,
    pontos_removidos: vendorStats.pontos_removidos,
    ultimo_ajuste: vendorStats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ [vendorDataProcessor] Created summary with ${result.length} vendors`);
  return result;
};
