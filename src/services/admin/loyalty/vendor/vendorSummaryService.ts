
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('🔍 [vendorSummaryService] === CORREÇÃO DEFINITIVA - VENDOR SUMMARY ===');
    console.log('🔍 [vendorSummaryService] Timestamp:', new Date().toISOString());
    console.log('🔍 [vendorSummaryService] Implementando fetch robusto com validação crítica');

    // STEP 1: Fetch ALL adjustments com validação rigorosa
    console.log('📊 [vendorSummaryService] Step 1: Fetching ALL adjustments...');
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.error('❌ [vendorSummaryService] CRÍTICO: Nenhum ajuste encontrado no fetch!');
      toast.error('Nenhum ajuste encontrado no banco de dados');
      return [];
    }

    console.log(`📊 [vendorSummaryService] SUCESSO Step 1: ${allAdjustments.length} ajustes fetched`);
    
    // VALIDAÇÃO CRÍTICA: Análise de integridade
    const vendorAdjustmentCounts = new Map<string, number>();
    allAdjustments.forEach(adj => {
      const count = vendorAdjustmentCounts.get(adj.vendedor_id) || 0;
      vendorAdjustmentCounts.set(adj.vendedor_id, count + 1);
    });

    console.log('🔍 [vendorSummaryService] ANÁLISE DE INTEGRIDADE DOS DADOS FETCHED:');
    console.log(`  - Total adjustments: ${allAdjustments.length}`);
    console.log(`  - Unique vendors: ${vendorAdjustmentCounts.size}`);
    
    Array.from(vendorAdjustmentCounts.entries()).forEach(([vendorId, count]) => {
      console.log(`  - Vendor ${vendorId}: ${count} adjustments`);
    });

    // VALIDAÇÃO: Esperamos pelo menos 35+ ajustes
    if (allAdjustments.length < 35) {
      console.warn(`⚠️ [vendorSummaryService] ATENÇÃO: Apenas ${allAdjustments.length} ajustes (esperado ~37)`);
      toast.warning(`Apenas ${allAdjustments.length} ajustes encontrados (pode estar incompleto)`);
    }

    // STEP 2: Fetch vendor data com validação crítica
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log(`🔍 [vendorSummaryService] Step 2: Fetching vendor data para ${uniqueVendorIds.length} vendors`);
    console.log(`  Vendor IDs: ${uniqueVendorIds.join(', ')}`);

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.error('❌ [vendorSummaryService] CRÍTICO: Nenhum vendedor encontrado!');
      console.error('   Ajustes existem mas vendedores não foram encontrados na tabela vendedores');
      toast.error('Erro crítico: vendedores não encontrados');
      return [];
    }

    console.log(`🏪 [vendorSummaryService] SUCESSO Step 2: ${vendorsData.length} vendedores encontrados`);

    // VALIDAÇÃO CRÍTICA: Verificar correspondência vendor_id
    const foundVendorIds = new Set(vendorsData.map(v => v.id));
    const missingVendorIds = uniqueVendorIds.filter(id => !foundVendorIds.has(id));
    
    if (missingVendorIds.length > 0) {
      console.error('🚨 [vendorSummaryService] PROBLEMA CRÍTICO: Vendedores missing na tabela vendedores!');
      console.error(`   ${missingVendorIds.length} vendor(s) têm adjustments mas não existem na tabela vendedores:`);
      missingVendorIds.forEach(missingId => {
        const adjustmentCount = vendorAdjustmentCounts.get(missingId) || 0;
        console.error(`   - Vendor ID ${missingId}: ${adjustmentCount} adjustments SERÃO PERDIDOS`);
      });
      toast.error(`${missingVendorIds.length} vendedores não encontrados - dados serão perdidos`);
    }
    
    // VERIFICAÇÃO ESPECÍFICA: Buscar Beaba e Mais Real
    console.log('🎯 [vendorSummaryService] VERIFICAÇÃO ESPECÍFICA DOS VENDEDORES CHAVE:');
    
    let maisRealFound = false;
    let beabaFound = false;
    
    vendorsData.forEach(vendor => {
      const nameLower = vendor.nome_loja?.toLowerCase().trim() || '';
      const adjustmentCount = vendorAdjustmentCounts.get(vendor.id) || 0;
      
      if (nameLower.includes('mais real')) {
        maisRealFound = true;
        console.log(`🎯 [vendorSummaryService] MAIS REAL ENCONTRADO: ID=${vendor.id}, Nome="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
      }
      if (nameLower.includes('beaba')) {
        beabaFound = true;
        console.log(`🎯 [vendorSummaryService] BEABA ENCONTRADO: ID=${vendor.id}, Nome="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
      }
    });

    if (!maisRealFound) {
      console.error('🚨 [vendorSummaryService] CRÍTICO: MAIS REAL NÃO ENCONTRADO na tabela vendedores!');
      toast.error('Vendor "Mais Real" não encontrado');
    }
    
    if (!beabaFound) {
      console.error('🚨 [vendorSummaryService] CRÍTICO: BEABA NÃO ENCONTRADO na tabela vendedores!');
      toast.error('Vendor "Beaba" não encontrado');
    }

    // STEP 3: Process data com validação robusta
    console.log('🔄 [vendorSummaryService] Step 3: Processing summary com validação crítica...');
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);

    // VALIDAÇÃO FINAL CRÍTICA
    console.log('🔍 [vendorSummaryService] === VALIDAÇÃO FINAL CRÍTICA ===');
    console.log(`📊 Result contém ${result.length} vendor summaries`);
    
    // Verificar integridade dos dados processados
    const totalAdjustmentsExpected = allAdjustments.length;
    const totalAdjustmentsInResult = result.reduce((sum, r) => sum + r.total_ajustes, 0);
    const dataLoss = totalAdjustmentsExpected - totalAdjustmentsInResult;
    const dataLossPercentage = totalAdjustmentsExpected > 0 ? ((dataLoss / totalAdjustmentsExpected) * 100).toFixed(2) : '0';
    
    console.log(`📊 INTEGRIDADE DOS DADOS PROCESSADOS:`);
    console.log(`  - Expected adjustments: ${totalAdjustmentsExpected}`);
    console.log(`  - Adjustments in result: ${totalAdjustmentsInResult}`);
    console.log(`  - Data loss: ${dataLoss} adjustments (${dataLossPercentage}%)`);
    
    if (dataLoss > 0) {
      console.error(`🚨 [vendorSummaryService] PERDA DE DADOS DETECTADA: ${dataLoss} adjustments perdidos!`);
      toast.error(`${dataLoss} ajustes foram perdidos no processamento`);
    }
    
    // Log detalhado de cada vendedor no resultado
    result.forEach((summary, index) => {
      console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments`);
      console.log(`      Points: +${summary.pontos_adicionados}, -${summary.pontos_removidos}`);
      
      const nameLower = summary.vendedor_nome.toLowerCase().trim();
      if (nameLower.includes('mais real')) {
        console.log(`    🎉 [vendorSummaryService] MAIS REAL NO RESULTADO FINAL!`);
      }
      if (nameLower.includes('beaba')) {
        console.log(`    🎉 [vendorSummaryService] BEABA NO RESULTADO FINAL!`);
      }
    });

    // VERIFICAÇÃO FINAL DOS VENDEDORES CHAVE
    const maisRealInResult = result.find(r => r.vendedor_nome.toLowerCase().includes('mais real'));
    const beabaInResult = result.find(r => r.vendedor_nome.toLowerCase().includes('beaba'));
    
    console.log('🎯 [vendorSummaryService] VERIFICAÇÃO FINAL DOS VENDEDORES CHAVE:');
    console.log(`  - Mais Real: ${!!maisRealInResult ? 'PRESENTE ✅' : 'MISSING ❌'}`);
    console.log(`  - Beaba: ${!!beabaInResult ? 'PRESENTE ✅' : 'MISSING ❌'}`);
    
    if (!maisRealInResult && maisRealFound) {
      console.error('🚨 [vendorSummaryService] MAIS REAL FOI PERDIDO NO PROCESSAMENTO!');
      toast.error('Mais Real foi perdido durante o processamento');
    }
    
    if (!beabaInResult && beabaFound) {
      console.error('🚨 [vendorSummaryService] BEABA FOI PERDIDO NO PROCESSAMENTO!');
      toast.error('Beaba foi perdido durante o processamento');
    }

    // SUCESSO com alertas se necessário
    if (result.length >= 2 && maisRealInResult && beabaInResult) {
      console.log('✅ [vendorSummaryService] SUCESSO COMPLETO: Ambos vendedores presentes no resultado');
      toast.success(`Summary completo: ${result.length} vendedores, ${totalAdjustmentsInResult} ajustes`);
    } else if (result.length > 0) {
      console.warn('⚠️ [vendorSummaryService] SUCESSO PARCIAL: Alguns vendedores podem estar missing');
      toast.warning(`Summary parcial: ${result.length} vendedores encontrados`);
    }

    console.log('✅ [vendorSummaryService] SUMMARY FINALIZADO com validação robusta');
    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] ERRO FATAL em getVendorAdjustmentsSummary:', error);
    toast.error('Erro crítico ao buscar resumo de ajustes por vendedor');
    return [];
  }
};
