
import { VendorAdjustment, VendorAdjustmentSummary } from '../types';
import { RawVendorAdjustment } from './vendorAdjustmentsFetcher';

export const processVendorAdjustments = (
  adjustments: RawVendorAdjustment[],
  vendors: any[],
  users: any[]
): VendorAdjustment[] => {
  console.log('🔍 [vendorDataProcessor] === CORREÇÃO DEFINITIVA - PROCESSING ===');
  console.log(`📊 Input: ${adjustments.length} adjustments, ${vendors.length} vendors, ${users.length} users`);
  
  // VALIDAÇÃO INICIAL CRÍTICA
  if (!adjustments || adjustments.length === 0) {
    console.error('❌ [vendorDataProcessor] ERRO CRÍTICO: Nenhum adjustment recebido para processar!');
    return [];
  }

  if (!vendors || vendors.length === 0) {
    console.error('❌ [vendorDataProcessor] ERRO CRÍTICO: Nenhum vendor recebido para mapear!');
    return [];
  }

  // Criar vendor map robusto com validação
  const vendorNameMap = new Map<string, string>();
  const userMap = new Map<string, string>();
  
  // Build vendor map com log detalhado
  vendors.forEach((vendor, index) => {
    if (!vendor.id || !vendor.nome_loja) {
      console.error(`❌ [vendorDataProcessor] Vendor inválido no índice ${index}:`, vendor);
      return;
    }
    
    vendorNameMap.set(vendor.id, vendor.nome_loja);
    console.log(`🏪 [vendorDataProcessor] Vendor mapeado: ${vendor.id} -> "${vendor.nome_loja}"`);
    
    // Track específico dos vendedores chave
    const nameLower = vendor.nome_loja.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`🎯 [vendorDataProcessor] MAIS REAL MAPEADO: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`🎯 [vendorDataProcessor] BEABA MAPEADO: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });
  
  // Build user map
  users.forEach((user) => {
    if (!user.id) return;
    userMap.set(user.id, user.nome || 'Usuário sem nome');
  });
  
  console.log(`🗺️ [vendorDataProcessor] Maps criados: ${vendorNameMap.size} vendors, ${userMap.size} users`);

  // PROCESSAMENTO com validação rigorosa
  const result: VendorAdjustment[] = [];
  const stats = {
    processed: 0,
    skipped: 0,
    missingVendor: 0,
    missingUser: 0,
    maisRealProcessed: 0,
    beabaProcessed: 0
  };

  adjustments.forEach((adjustment, index) => {
    console.log(`🔄 [vendorDataProcessor] Processing ${index + 1}/${adjustments.length}: vendorId=${adjustment.vendedor_id}`);
    
    const vendorName = vendorNameMap.get(adjustment.vendedor_id);
    const userName = userMap.get(adjustment.usuario_id);
    
    if (!vendorName) {
      console.error(`❌ [vendorDataProcessor] CRÍTICO: Vendor não encontrado para ID ${adjustment.vendedor_id}`);
      console.error(`🔍 [vendorDataProcessor] IDs disponíveis: ${Array.from(vendorNameMap.keys()).join(', ')}`);
      stats.skipped++;
      stats.missingVendor++;
      return; // SKIP este adjustment
    }
    
    if (!userName) {
      console.warn(`⚠️ [vendorDataProcessor] User não encontrado para ID ${adjustment.usuario_id}`);
      stats.missingUser++;
    }
    
    // Track vendedores específicos
    const vendorNameLower = vendorName.toLowerCase().trim();
    if (vendorNameLower.includes('mais real')) {
      stats.maisRealProcessed++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real adjustment ${stats.maisRealProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    if (vendorNameLower.includes('beaba')) {
      stats.beabaProcessed++;
      console.log(`🎯 [vendorDataProcessor] Processing Beaba adjustment ${stats.beabaProcessed}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    
    // Criar adjustment processado
    const processedAdjustment: VendorAdjustment = {
      ...adjustment,
      vendedor_nome: vendorName,
      usuario_nome: userName || 'Usuário desconhecido'
    };
    
    result.push(processedAdjustment);
    stats.processed++;
    
    if (index < 5) { // Log dos primeiros 5 para debug
      console.log(`✅ [vendorDataProcessor] Processed: "${vendorName}" (${adjustment.tipo}: ${adjustment.valor})`);
    }
  });

  console.log(`✅ [vendorDataProcessor] === PROCESSING RESULT ===`);
  console.log(`📊 Stats:`, stats);
  
  // VALIDAÇÃO FINAL CRÍTICA
  const uniqueVendorsInResult = [...new Set(result.map(r => r.vendedor_nome))];
  console.log(`🏪 [vendorDataProcessor] Vendors únicos no resultado (${uniqueVendorsInResult.length}): ${uniqueVendorsInResult.join(', ')}`);
  
  // Verificação específica dos vendedores chave
  const maisRealInResult = result.filter(r => r.vendedor_nome.toLowerCase().includes('mais real'));
  const beabaInResult = result.filter(r => r.vendedor_nome.toLowerCase().includes('beaba'));
  
  console.log(`🎯 [vendorDataProcessor] VERIFICAÇÃO FINAL:`);
  console.log(`  - Mais Real: ${maisRealInResult.length} adjustments no resultado`);
  console.log(`  - Beaba: ${beabaInResult.length} adjustments no resultado`);
  
  // ALERTAS se houver problemas
  if (stats.skipped > 0) {
    console.error(`🚨 [vendorDataProcessor] ALERTA: ${stats.skipped} adjustments foram PERDIDOS por vendor não encontrado!`);
  }
  
  if (stats.maisRealProcessed === 0 && adjustments.some(adj => adj.vendedor_id)) {
    console.error('🚨 [vendorDataProcessor] ALERTA: Nenhum adjustment do Mais Real foi processado!');
  }

  console.log(`✅ [vendorDataProcessor] RESULTADO FINAL: ${result.length} adjustments processados de ${adjustments.length} input`);
  return result;
};

export const processVendorAdjustmentsSummary = (
  adjustments: RawVendorAdjustment[],
  vendors: any[]
): VendorAdjustmentSummary[] => {
  console.log('🔍 [vendorDataProcessor] === CORREÇÃO DEFINITIVA - SUMMARY ===');
  console.log(`📊 Input: ${adjustments.length} adjustments, ${vendors.length} vendors`);
  
  // VALIDAÇÃO INICIAL
  if (!adjustments || adjustments.length === 0) {
    console.error('❌ [vendorDataProcessor] ERRO: Nenhum adjustment para summary!');
    return [];
  }

  if (!vendors || vendors.length === 0) {
    console.error('❌ [vendorDataProcessor] ERRO: Nenhum vendor para summary!');
    return [];
  }
  
  // Criar vendor map robusto
  const vendorMap = new Map<string, any>();
  
  vendors.forEach((vendor, index) => {
    if (!vendor.id || !vendor.nome_loja) {
      console.error(`❌ [vendorDataProcessor] Vendor inválido para summary no índice ${index}:`, vendor);
      return;
    }
    
    vendorMap.set(vendor.id, vendor);
    console.log(`🏪 [vendorDataProcessor] Summary vendor mapeado: ${vendor.id} -> "${vendor.nome_loja}"`);
    
    // Track vendedores específicos
    const nameLower = vendor.nome_loja.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`🎯 [vendorDataProcessor] MAIS REAL MAPEADO PARA SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`🎯 [vendorDataProcessor] BEABA MAPEADO PARA SUMMARY: ${vendor.id} -> "${vendor.nome_loja}"`);
    }
  });

  // Process e aggregate com validação robusta
  const vendorStatsMap = new Map<string, {
    vendedor_nome: string;
    total_ajustes: number;
    pontos_adicionados: number;
    pontos_removidos: number;
    ultimo_ajuste: string;
  }>();
  
  const stats = {
    processed: 0,
    skipped: 0,
    missingVendor: 0,
    maisRealAdjustments: 0,
    beabaAdjustments: 0
  };
  
  console.log('🔄 [vendorDataProcessor] Processing adjustments para summary...');
  
  adjustments.forEach((adjustment, index) => {
    const vendorId = adjustment.vendedor_id;
    const vendor = vendorMap.get(vendorId);
    
    if (!vendor) {
      console.error(`❌ [vendorDataProcessor] CRÍTICO: Vendor não encontrado para vendorId: ${vendorId}`);
      console.error(`🔍 [vendorDataProcessor] IDs disponíveis: ${Array.from(vendorMap.keys()).join(', ')}`);
      console.error(`🔍 [vendorDataProcessor] Este adjustment será PERDIDO:`, {
        id: adjustment.id,
        vendedor_id: adjustment.vendedor_id,
        tipo: adjustment.tipo,
        valor: adjustment.valor
      });
      stats.skipped++;
      stats.missingVendor++;
      return; // SKIP este adjustment
    }

    // Track vendedores específicos
    const vendorNameLower = vendor.nome_loja.toLowerCase().trim();
    if (vendorNameLower.includes('mais real')) {
      stats.maisRealAdjustments++;
      console.log(`🎯 [vendorDataProcessor] Processing Mais Real summary ${stats.maisRealAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
    }
    if (vendorNameLower.includes('beaba')) {
      stats.beabaAdjustments++;
      console.log(`🎯 [vendorDataProcessor] Processing Beaba summary ${stats.beabaAdjustments}: ${adjustment.tipo} ${adjustment.valor} pts`);
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
      console.log(`📝 [vendorDataProcessor] Created summary stats para: "${vendor.nome_loja}"`);
    }

    const vendorStats = vendorStatsMap.get(vendorId)!;
    
    // Update stats
    vendorStats.total_ajustes += 1;
    
    if (adjustment.tipo === 'adicao') {
      vendorStats.pontos_adicionados += adjustment.valor;
    } else if (adjustment.tipo === 'remocao') {
      vendorStats.pontos_removidos += Math.abs(adjustment.valor);
    }
    
    // Update latest adjustment date
    if (new Date(adjustment.created_at) > new Date(vendorStats.ultimo_ajuste)) {
      vendorStats.ultimo_ajuste = adjustment.created_at;
    }

    stats.processed++;
    
    // Log específico dos vendedores chave
    if (vendorNameLower.includes('mais real')) {
      console.log(`🎯 [vendorDataProcessor] Mais Real summary updated: ${vendorStats.total_ajustes} total, +${vendorStats.pontos_adicionados}, -${vendorStats.pontos_removidos}`);
    }
    if (vendorNameLower.includes('beaba')) {
      console.log(`🎯 [vendorDataProcessor] Beaba summary updated: ${vendorStats.total_ajustes} total, +${vendorStats.pontos_adicionados}, -${vendorStats.pontos_removidos}`);
    }
  });

  console.log(`✅ [vendorDataProcessor] Summary processing completo:`, stats);

  // Convert para array e sort
  const result = Array.from(vendorStatsMap.entries()).map(([vendorId, vendorStats]) => ({
    vendedor_id: vendorId,
    vendedor_nome: vendorStats.vendedor_nome,
    total_ajustes: vendorStats.total_ajustes,
    pontos_adicionados: vendorStats.pontos_adicionados,
    pontos_removidos: vendorStats.pontos_removidos,
    ultimo_ajuste: vendorStats.ultimo_ajuste
  })).sort((a, b) => b.total_ajustes - a.total_ajustes);

  console.log(`✅ [vendorDataProcessor] === SUMMARY RESULT FINAL ===`);
  console.log(`📊 Retornando ${result.length} vendor summaries:`);
  
  result.forEach((summary, index) => {
    console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments (+${summary.pontos_adicionados}, -${summary.pontos_removidos})`);
    
    // Highlight vendedores chave
    const nameLower = summary.vendedor_nome.toLowerCase().trim();
    if (nameLower.includes('mais real')) {
      console.log(`    🎉 [vendorDataProcessor] MAIS REAL NO SUMMARY FINAL: ${summary.total_ajustes} adjustments`);
    }
    if (nameLower.includes('beaba')) {
      console.log(`    🎉 [vendorDataProcessor] BEABA NO SUMMARY FINAL: ${summary.total_ajustes} adjustments`);
    }
  });

  // VALIDAÇÃO FINAL CRÍTICA
  const maisRealInResult = result.find(v => v.vendedor_nome.toLowerCase().includes('mais real'));
  const beabaInResult = result.find(v => v.vendedor_nome.toLowerCase().includes('beaba'));
  
  console.log(`🎯 [vendorDataProcessor] VALIDAÇÃO FINAL CRÍTICA:`);
  console.log(`  - Mais Real no resultado: ${!!maisRealInResult ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log(`  - Beaba no resultado: ${!!beabaInResult ? 'SIM ✅' : 'NÃO ❌'}`);
  
  // ALERTAS CRÍTICOS
  if (stats.skipped > 0) {
    console.error(`🚨 [vendorDataProcessor] ALERTA CRÍTICO: ${stats.skipped} adjustments foram PERDIDOS no summary!`);
  }
  
  if (!maisRealInResult && stats.maisRealAdjustments > 0) {
    console.error('🚨 [vendorDataProcessor] ERRO CRÍTICO: Mais Real foi perdido durante o summary processing!');
  }

  return result;
};
