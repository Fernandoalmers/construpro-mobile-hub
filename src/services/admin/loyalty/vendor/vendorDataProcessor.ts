
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[]
): VendorAdjustment[] => {
  console.log('🔍 [vendorDataProcessor] === CORREÇÃO DEFINITIVA - PROCESSING START ===');
  console.log(`📊 Input: ${adjustments.length} adjustments, ${vendors.length} vendors, ${users.length} users`);
  
  // Criar mapas robustos com validação
  const vendorNameMap = new Map<string, string>();
  const userMap = new Map<string, string>();
  
  // Build vendor map com validação robusta
  vendors.forEach((vendor, index) => {
    if (!vendor.id || !vendor.nome_loja) {
      console.error(`❌ Vendor inválido no índice ${index}:`, vendor);
      return;
    }
    
    vendorNameMap.set(vendor.id, vendor.nome_loja);
    console.log(`🏪 Vendor mapeado: ${vendor.id} -> "${vendor.nome_loja}"`);
    
    const nameLower = vendor.nome_loja.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`🎯 MAIS REAL MAPEADO: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`🎯 BEABA MAPEADO: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });
  
  // Build user map
  users.forEach((user, index) => {
    if (!user.id) {
      console.error(`❌ User inválido no índice ${index}:`, user);
      return;
    }
    userMap.set(user.id, user.nome || 'Usuário sem nome');
  });
  
  console.log(`🗺️ Maps criados: ${vendorNameMap.size} vendors, ${userMap.size} users`);

  // Process adjustments com validação robusta
  const result: VendorAdjustment[] = [];
  const processingStats = {
    processed: 0,
    skipped: 0,
    missingVendor: 0,
    missingUser: 0,
    maisRealProcessed: 0,
    beabaProcessed: 0
  };

  adjustments.forEach((adjustment, index) => {
    console.log(`🔄 Processing adjustment ${index + 1}/${adjustments.length}: ${adjustment.id}`);
    console.log(`    Vendor: ${adjustment.vendedor_id}, User: ${adjustment.usuario_id}`);
    
    const vendorName = vendorNameMap.get(adjustment.vendedor_id);
    const userName = userMap.get(adjustment.usuario_id);
    
    if (!vendorName) {
      console.error(`❌ CRÍTICO: Vendor não encontrado para ID ${adjustment.vendedor_id}`);
      console.log(`🔍 Vendor IDs disponíveis: ${Array.from(vendorNameMap.keys()).join(', ')}`);
      processingStats.skipped++;
      processingStats.missingVendor++;
      return;
    }
    
    if (!userName) {
      console.warn(`⚠️ User não encontrado para ID ${adjustment.usuario_id}`);
      processingStats.missingUser++;
    }
    
    // Track vendor específico
    const vendorNameLower = vendorName.toLowerCase().trim();
    if (vendorNameLower.includes('mais real')) {
      processingStats.maisRealProcessed++;
      console.log(`🎯 Processing Mais Real adjustment ${processingStats.maisRealProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    if (vendorNameLower.includes('beaba')) {
      processingStats.beabaProcessed++;
      console.log(`🎯 Processing Beaba adjustment ${processingStats.beabaProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    
    const processedAdjustment: VendorAdjustment = {
      ...adjustment,
      vendedor_nome: vendorName,
      usuario_nome: userName || 'Usuário desconhecido'
    };
    
    result.push(processedAdjustment);
    processingStats.processed++;
    
    console.log(`✅ Processed: "${vendorName}" (${adjustment.tipo}: ${adjustment.valor})`);
  });

  console.log(`✅ === PROCESSING COMPLETO ===`);
  console.log(`📊 Stats:`, processingStats);
  
  // Validação final
  const uniqueVendorsInResult = [...new Set(result.map(r => r.vendedor_nome))];
  console.log(`🏪 Unique vendors no resultado (${uniqueVendorsInResult.length}): ${uniqueVendorsInResult.join(', ')}`);
  
  // Verificação crítica dos vendedores chave
  const maisRealInResult = result.filter(r => r.vendedor_nome.toLowerCase().includes('mais real'));
  const beabaInResult = result.filter(r => r.vendedor_nome.toLowerCase().includes('beaba'));
  
  console.log(`🎯 VERIFICAÇÃO FINAL:`);
  console.log(`  - Mais Real: ${maisRealInResult.length} adjustments`);
  console.log(`  - Beaba: ${beabaInResult.length} adjustments`);
  
  if (maisRealInResult.length === 0 && processingStats.maisRealProcessed > 0) {
    console.error('❌ ERRO CRÍTICO: Mais Real data perdida durante processing!');
  }
  
  return result;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log('🔍 [vendorDataProcessor] === CORREÇÃO DEFINITIVA - SUMMARY PROCESSING ===');
  console.log(`📊 Input: ${adjustments.length} adjustments, ${vendors.length} vendors`);
  
  // Criar vendor map robusto
  const vendorMap = new Map<string, any>();
  
  vendors.forEach((vendor, index) => {
    if (!vendor.id || !vendor.nome_loja) {
      console.error(`❌ Vendor inválido para summary no índice ${index}:`, vendor);
      return;
    }
    
    vendorMap.set(vendor.id, vendor);
    console.log(`🏪 Summary vendor mapeado: ${vendor.id} -> "${vendor.nome_loja}"`);
    
    const nameLower = vendor.nome_loja.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`🎯 MAIS REAL MAPEADO PARA SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`🎯 BEABA MAPEADO PARA SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });

  // Process e aggregate com tracking robusto
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
  
  console.log('🔄 Processing adjustments para summary...');
  
  adjustments.forEach((adjustment, index) => {
    const vendorId = adjustment.vendedor_id;
    const vendor = vendorMap.get(vendorId);
    
    console.log(`🔄 Summary processing adjustment ${index + 1}: vendorId=${vendorId}`);
    
    if (!vendor) {
      console.error(`❌ CRÍTICO: Vendor não encontrado para vendorId: ${vendorId}`);
      console.log(`🔍 Vendor IDs disponíveis: ${Array.from(vendorMap.keys()).join(', ')}`);
      console.log(`🔍 Este adjustment será PERDIDO:`, adjustment);
      processingStats.skipped++;
      processingStats.missingVendor++;
      return;
    }

    // Track vendor específico
    const vendorNameLower = vendor.nome_loja.toLowerCase().trim();
    if (vendorNameLower.includes('mais real')) {
      processingStats.maisRealAdjustments++;
      console.log(`🎯 Processing Mais Real summary adjustment ${processingStats.maisRealAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    if (vendorNameLower.includes('beaba')) {
      processingStats.beabaAdjustments++;
      console.log(`🎯 Processing Beaba summary adjustment ${processingStats.beabaAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }

    // Initialize ou update vendor stats
    if (!vendorStatsMap.has(vendorId)) {
      vendorStatsMap.set(vendorId, {
        vendedor_nome: vendor.nome_loja,
        total_ajustes: 0,
        pontos_adicionados: 0,
        pontos_removidos: 0,
        ultimo_ajuste: adjustment.created_at
      });
      console.log(`📝 Created summary stats para: "${vendor.nome_loja}"`);
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
      console.log(`🎯 Mais Real summary stats updated: ${stats.total_ajustes} total, +${stats.pontos_adicionados}, -${stats.pontos_removidos}`);
    }
    if (vendorNameLower.includes('beaba')) {
      console.log(`🎯 Beaba summary stats updated: ${stats.total_ajustes} total, +${stats.pontos_adicionados}, -${stats.pontos_removidos}`);
    }
  });

  console.log(`✅ Summary processing completo:`, processingStats);

  // Convert para array e sort
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: stats.vendedor_nome,
    total_ajustes: stats.total_ajustes,
    pontos_adicionados: stats.pontos_adicionados,
    pontos_removidos: stats.pontos_removidos,
    ultimo_ajuste: stats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ === SUMMARY RESULT FINAL ===`);
  console.log(`📊 Retornando ${result.length} vendor summaries:`);
  
  result.forEach((summary, index) => {
    console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments (+${summary.pontos_adicionados}, -${summary.pontos_removidos})`);
    
    const nameLower = summary.vendedor_nome.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`    🎉 MAIS REAL NO SUMMARY FINAL: ${summary.total_ajustes} adjustments`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`    🎉 BEABA NO SUMMARY FINAL: ${summary.total_ajustes} adjustments`);
    }
  });

  // VALIDAÇÃO FINAL CRÍTICA
  const maisRealInResult = result.find(v => v.vendedor_nome.toLowerCase().includes('mais real'));
  const beabaInResult = result.find(v => v.vendedor_nome.toLowerCase().includes('beaba'));
  
  console.log(`🎯 VALIDAÇÃO FINAL CRÍTICA:`);
  console.log(`  - Mais Real no resultado: ${!!maisRealInResult ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log(`  - Beaba no resultado: ${!!beabaInResult ? 'SIM ✅' : 'NÃO ❌'}`);
  
  if (!maisRealInResult && processingStats.maisRealAdjustments > 0) {
    console.error('❌ ERRO CRÍTICO: Mais Real foi perdido durante o summary processing!');
    console.log('🔍 Debug para Mais Real:');
    
    // Enhanced debugging
    console.log('🔍 vendorStatsMap contents:');
    Array.from(vendorStatsMap.entries()).forEach(([id, stats]) => {
      console.log(`  - ${id}: ${stats.vendedor_nome} (${stats.total_ajustes} adjustments)`);
    });
    
    console.log('🔍 Original vendors:');
    vendors.forEach(v => {
      console.log(`  - ${v.id}: "${v.nome_loja}" (includes mais real: ${v.nome_loja?.toLowerCase().includes('mais real')})`);
    });
  }

  return result;
};
