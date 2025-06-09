
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustmentSummary } from '../types';
import { fetchVendorAdjustments, fetchVendorsForAdjustments } from './vendorAdjustmentsFetcher';
import { processVendorAdjustmentsSummary } from './vendorDataProcessor';

export const getVendorAdjustmentsSummary = async (): Promise<VendorAdjustmentSummary[]> => {
  try {
    console.log('🔍 [vendorSummaryService] === CORREÇÃO DEFINITIVA - VENDOR SUMMARY ===');
    console.log('🔍 [vendorSummaryService] Timestamp:', new Date().toISOString());
    console.log('🔍 [vendorSummaryService] Implementando fetch robusto com validação completa');

    // STEP 1: Fetch ALL adjustments com validação
    console.log('📊 [vendorSummaryService] Step 1: Fetching ALL adjustments...');
    const allAdjustments = await fetchVendorAdjustments();
    
    if (!allAdjustments || allAdjustments.length === 0) {
      console.error('❌ [vendorSummaryService] CRÍTICO: Nenhum ajuste encontrado!');
      return [];
    }

    console.log(`📊 [vendorSummaryService] SUCESSO: ${allAdjustments.length} ajustes fetched`);
    
    // VALIDAÇÃO CRÍTICA: Análise de integridade dos dados
    const vendorAdjustmentCounts = new Map<string, number>();
    allAdjustments.forEach(adj => {
      const count = vendorAdjustmentCounts.get(adj.vendedor_id) || 0;
      vendorAdjustmentCounts.set(adj.vendedor_id, count + 1);
    });

    console.log('🔍 [vendorSummaryService] VALIDAÇÃO DE INTEGRIDADE:');
    console.log(`  - Total adjustments: ${allAdjustments.length}`);
    console.log(`  - Unique vendors: ${vendorAdjustmentCounts.size}`);
    
    Array.from(vendorAdjustmentCounts.entries()).forEach(([vendorId, count]) => {
      console.log(`  - Vendor ${vendorId}: ${count} adjustments`);
    });

    // STEP 2: Fetch vendor data com validação
    const uniqueVendorIds = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
    console.log(`🔍 [vendorSummaryService] Step 2: Fetching vendor data for ${uniqueVendorIds.length} vendors`);
    console.log(`  Vendor IDs: ${uniqueVendorIds.join(', ')}`);

    const vendorsData = await fetchVendorsForAdjustments(uniqueVendorIds);
    
    if (!vendorsData || vendorsData.length === 0) {
      console.error('❌ [vendorSummaryService] CRÍTICO: Nenhum vendedor encontrado!');
      console.log('   Ajustes existem mas vendedores não foram encontrados');
      return [];
    }

    console.log(`🏪 [vendorSummaryService] VENDOR DATA: ${vendorsData.length} vendedores encontrados`);

    // VALIDAÇÃO CRÍTICA: Verificar correspondência
    const foundVendorIds = new Set(vendorsData.map(v => v.id));
    const missingVendorIds = uniqueVendorIds.filter(id => !foundVendorIds.has(id));
    
    if (missingVendorIds.length > 0) {
      console.error('🚨 [vendorSummaryService] PROBLEMA CRÍTICO: Vendedores missing!');
      console.error(`   ${missingVendorIds.length} vendor(s) have adjustments but no vendor record:`);
      missingVendorIds.forEach(missingId => {
        const adjustmentCount = vendorAdjustmentCounts.get(missingId) || 0;
        console.error(`   - Vendor ID ${missingId}: ${adjustmentCount} adjustments PERDIDOS`);
      });
    }
    
    // VERIFICAÇÃO ESPECÍFICA: Procurar por Beaba e Mais Real
    console.log('🎯 [vendorSummaryService] VERIFICAÇÃO ESPECÍFICA DOS VENDEDORES CHAVE:');
    
    vendorsData.forEach(vendor => {
      const nameLower = vendor.nome_loja?.toLowerCase().trim() || '';
      const adjustmentCount = vendorAdjustmentCounts.get(vendor.id) || 0;
      
      if (nameLower.includes('mais real')) {
        console.log(`🎯 MAIS REAL ENCONTRADO: ID=${vendor.id}, Nome="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
      }
      if (nameLower.includes('beaba')) {
        console.log(`🎯 BEABA ENCONTRADO: ID=${vendor.id}, Nome="${vendor.nome_loja}", Adjustments=${adjustmentCount}`);
      }
    });

    // STEP 3: Process data com validação robusta
    console.log('🔄 [vendorSummaryService] Step 3: Processing summary com validação...');
    const result = processVendorAdjustmentsSummary(allAdjustments, vendorsData);

    // VALIDAÇÃO FINAL CRÍTICA
    console.log('🔍 [vendorSummaryService] === VALIDAÇÃO FINAL CRÍTICA ===');
    console.log(`📊 Result contains ${result.length} vendor summaries`);
    
    // Verificar perda de dados
    const totalAdjustmentsExpected = allAdjustments.length;
    const totalAdjustmentsInResult = result.reduce((sum, r) => sum + r.total_ajustes, 0);
    const dataLoss = totalAdjustmentsExpected - totalAdjustmentsInResult;
    const dataLossPercentage = ((dataLoss / totalAdjustmentsExpected) * 100).toFixed(2);
    
    console.log(`📊 INTEGRIDADE DOS DADOS:`);
    console.log(`  - Expected adjustments: ${totalAdjustmentsExpected}`);
    console.log(`  - Adjustments in result: ${totalAdjustmentsInResult}`);
    console.log(`  - Data loss: ${dataLoss} adjustments (${dataLossPercentage}%)`);
    
    if (dataLoss > 0) {
      console.error(`🚨 PERDA DE DADOS DETECTADA: ${dataLoss} adjustments perdidos!`);
    }
    
    // Log final de cada vendedor
    result.forEach((summary, index) => {
      console.log(`  ${index + 1}. "${summary.vendedor_nome}" (ID: ${summary.vendedor_id}): ${summary.total_ajustes} adjustments`);
      console.log(`      Points: +${summary.pontos_adicionados}, -${summary.pontos_removidos}`);
      
      const nameLower = summary.vendedor_nome.toLowerCase().trim();
      if (nameLower.includes('mais real')) {
        console.log(`    🎉 MAIS REAL NO RESULTADO FINAL!`);
      }
      if (nameLower.includes('beaba')) {
        console.log(`    🎉 BEABA NO RESULTADO FINAL!`);
      }
    });

    // VERIFICAÇÃO FINAL DOS VENDEDORES CHAVE
    const maisRealInResult = result.find(r => r.vendedor_nome.toLowerCase().includes('mais real'));
    const beabaInResult = result.find(r => r.vendedor_nome.toLowerCase().includes('beaba'));
    
    console.log('🎯 VERIFICAÇÃO FINAL DOS VENDEDORES CHAVE:');
    console.log(`  - Mais Real: ${!!maisRealInResult ? 'PRESENTE ✅' : 'MISSING ❌'}`);
    console.log(`  - Beaba: ${!!beabaInResult ? 'PRESENTE ✅' : 'MISSING ❌'}`);
    
    if (!maisRealInResult) {
      console.error('🚨 MAIS REAL MISSING NO RESULTADO FINAL!');
      
      // Debug detalhado se Mais Real está missing
      const maisRealVendor = vendorsData.find(v => v.nome_loja?.toLowerCase().includes('mais real'));
      if (maisRealVendor) {
        const maisRealAdjustments = allAdjustments.filter(adj => adj.vendedor_id === maisRealVendor.id);
        console.log(`  DEBUG: Mais Real vendor encontrado: ${maisRealVendor.id} -> "${maisRealVendor.nome_loja}"`);
        console.log(`  DEBUG: Mais Real adjustments: ${maisRealAdjustments.length}`);
        console.log(`  DEBUG: Processamento falhou para Mais Real!`);
      }
    }

    // Alerta se houver perda significativa de dados
    if (dataLoss > 0) {
      console.error(`🚨 ALERTA: ${dataLoss} ajustes perdidos no processamento!`);
      toast.error(`Atenção: ${dataLoss} ajustes foram perdidos no processamento`);
    }

    console.log('✅ [vendorSummaryService] SUMMARY COMPLETO com validação robusta');
    return result;

  } catch (error) {
    console.error('❌ [vendorSummaryService] ERRO FATAL em getVendorAdjustmentsSummary:', error);
    toast.error('Erro crítico ao buscar resumo de ajustes por vendedor');
    return [];
  }
};
