
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustment, VendorAdjustmentSummary } from './types';

export const vendorService = {
  async getVendorAdjustments(limit?: number): Promise<VendorAdjustment[]> {
    try {
      console.log('🔍 [vendorService] Starting getVendorAdjustments - fetching ALL adjustments...');
      
      // Step 1: Get ALL adjustments without any limit
      const { data: allAdjustments, error: adjustmentsError } = await supabase
        .from('pontos_ajustados')
        .select('vendedor_id, usuario_id, tipo, valor, motivo, created_at, id')
        .order('created_at', { ascending: false });

      if (adjustmentsError) {
        console.error('❌ [vendorService] Error fetching adjustments:', adjustmentsError);
        throw adjustmentsError;
      }

      console.log(`📊 [vendorService] Retrieved ${allAdjustments?.length || 0} total adjustments from database`);

      if (!allAdjustments || allAdjustments.length === 0) {
        console.log('⚠️ [vendorService] No adjustments found in database');
        return [];
      }

      // Get unique vendor IDs from adjustments
      const vendorIdsInAdjustments = [...new Set(allAdjustments.map(adj => adj.vendedor_id))];
      console.log('🔍 [vendorService] Unique vendor IDs in adjustments:', vendorIdsInAdjustments);
      console.log('🔍 [vendorService] Number of unique vendors in adjustments:', vendorIdsInAdjustments.length);

      // Step 2: Get ALL vendors regardless of status - CRITICAL FIX
      console.log('🏪 [vendorService] Fetching ALL vendors from database (removed status filter)...');
      const { data: allVendors, error: vendorsError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, status')
        .in('id', vendorIdsInAdjustments);

      if (vendorsError) {
        console.error('❌ [vendorService] Error fetching vendors:', vendorsError);
        throw vendorsError;
      }

      console.log(`🏪 [vendorService] Retrieved ${allVendors?.length || 0} vendors from database`);
      console.log('🏪 [vendorService] DETAILED vendor info:');
      allVendors?.forEach(v => {
        console.log(`  - ID: ${v.id} | Nome: ${v.nome_loja} | Status: ${v.status}`);
      });

      if (!allVendors || allVendors.length === 0) {
        console.log('⚠️ [vendorService] No vendors found with the specified IDs');
        return [];
      }

      // Step 3: Process adjustments for all found vendors
      const vendorIds = new Set(allVendors.map(v => v.id));
      const filteredAdjustments = allAdjustments.filter(adj => 
        vendorIds.has(adj.vendedor_id)
      );

      console.log(`📊 [vendorService] ${filteredAdjustments.length} adjustments for found vendors`);
      console.log(`📊 [vendorService] Vendors found: ${allVendors.length}`);
      console.log(`📊 [vendorService] Vendor names: ${allVendors.map(v => v.nome_loja).join(', ')}`);
      
      // Group adjustments by vendor for detailed logging
      const adjustmentsByVendor = new Map<string, number>();
      filteredAdjustments.forEach(adj => {
        const count = adjustmentsByVendor.get(adj.vendedor_id) || 0;
        adjustmentsByVendor.set(adj.vendedor_id, count + 1);
      });

      console.log('📊 [vendorService] Adjustments per vendor (getVendorAdjustments):');
      Array.from(adjustmentsByVendor.entries()).forEach(([vendorId, count]) => {
        const vendor = allVendors.find(v => v.id === vendorId);
        console.log(`  - ${vendor?.nome_loja || vendorId} (${vendor?.status}): ${count} adjustments`);
      });

      // Step 4: Get user data
      const userIds = [...new Set(filteredAdjustments.map(a => a.usuario_id))];
      console.log('👥 [vendorService] Unique user IDs in filtered adjustments:', userIds);

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', userIds);

      if (usersError) {
        console.error('❌ [vendorService] Error fetching users:', usersError);
        throw usersError;
      }

      // Step 5: Create lookup maps and process results
      const vendorNameMap = new Map(allVendors.map(v => [v.id, v.nome_loja]));
      const userMap = new Map(usersData?.map(u => [u.id, u.nome]) || []);

      const result = filteredAdjustments.map(adjustment => ({
        ...adjustment,
        vendedor_nome: vendorNameMap.get(adjustment.vendedor_id) || 'Vendedor desconhecido',
        usuario_nome: userMap.get(adjustment.usuario_id) || 'Usuário desconhecido'
      }));

      console.log(`✅ [vendorService] Returning ${result.length} processed adjustments from getVendorAdjustments`);
      console.log(`✅ [vendorService] Unique vendors in result: ${[...new Set(result.map(r => r.vendedor_nome))].join(', ')}`);
      
      // Apply limit only for display purposes if specified
      const finalResult = limit ? result.slice(0, limit) : result;
      console.log(`📋 [vendorService] Final result after limit (${limit || 'no limit'}): ${finalResult.length} adjustments`);
      
      return finalResult;
    } catch (error) {
      console.error('❌ [vendorService] Error fetching vendor adjustments:', error);
      toast.error('Erro ao buscar ajustes de vendedores');
      return [];
    }
  },

  async getVendorAdjustmentsSummary(): Promise<VendorAdjustmentSummary[]> {
    try {
      console.log('🔍 [vendorService] === STARTING VENDOR ADJUSTMENTS SUMMARY ===');
      console.log('🔍 [vendorService] Timestamp:', new Date().toISOString());

      // CORREÇÃO: Usar a mesma lógica da página de stores
      // Step 1: Buscar TODOS os vendedores primeiro (igual stores page)
      console.log('🏪 [vendorService] CORREÇÃO: Buscando TODOS os vendedores primeiro (como stores page)...');
      const { data: allVendors, error: vendorsError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, status')
        .order('nome_loja', { ascending: true });

      if (vendorsError) {
        console.error('❌ [vendorService] Error fetching all vendors:', vendorsError);
        throw vendorsError;
      }

      console.log(`🏪 [vendorService] CORREÇÃO - Retrieved ${allVendors?.length || 0} vendors from database`);
      console.log('🏪 [vendorService] CORREÇÃO - ALL vendor info:');
      allVendors?.forEach((v, index) => {
        console.log(`  ${index + 1}. ID: ${v.id} | Nome: ${v.nome_loja} | Status: ${v.status}`);
      });

      if (!allVendors || allVendors.length === 0) {
        console.log('⚠️ [vendorService] CORREÇÃO - No vendors found');
        return [];
      }

      // Step 2: Buscar TODOS os ajustes (sem filtro por vendedor)
      console.log('📊 [vendorService] CORREÇÃO - Fetching ALL adjustments (no vendor filter)...');
      const { data: allAdjustments, error: adjustmentsError } = await supabase
        .from('pontos_ajustados')
        .select('vendedor_id, tipo, valor, created_at')
        .order('created_at', { ascending: false });

      if (adjustmentsError) {
        console.error('❌ [vendorService] Error fetching adjustments:', adjustmentsError);
        throw adjustmentsError;
      }

      console.log(`📊 [vendorService] CORREÇÃO - Retrieved ${allAdjustments?.length || 0} total adjustments from database`);

      if (!allAdjustments || allAdjustments.length === 0) {
        console.log('⚠️ [vendorService] CORREÇÃO - No adjustments found, returning empty summaries for all vendors');
        // Retornar vendedores com zero ajustes
        return allVendors.map(vendor => ({
          vendedor_id: vendor.id,
          vendedor_nome: vendor.nome_loja,
          total_ajustes: 0,
          pontos_adicionados: 0,
          pontos_removidos: 0,
          ultimo_ajuste: new Date().toISOString()
        }));
      }

      // Step 3: Criar mapa de estatísticas por vendedor (incluindo TODOS os vendedores)
      console.log('🔍 [vendorService] CORREÇÃO - Creating stats map for ALL vendors...');
      const vendorStatsMap = new Map<string, {
        vendedor_nome: string;
        total_ajustes: number;
        pontos_adicionados: number;
        pontos_removidos: number;
        ultimo_ajuste: string;
      }>();

      // Inicializar TODOS os vendedores com zero ajustes
      allVendors.forEach(vendor => {
        vendorStatsMap.set(vendor.id, {
          vendedor_nome: vendor.nome_loja,
          total_ajustes: 0,
          pontos_adicionados: 0,
          pontos_removidos: 0,
          ultimo_ajuste: new Date().toISOString()
        });
      });

      // Step 4: Processar ajustes para vendedores que os possuem
      console.log('🔍 [vendorService] CORREÇÃO - Processing adjustments for vendors...');
      allAdjustments.forEach((adjustment, index) => {
        const vendorId = adjustment.vendedor_id;
        
        // Verificar se o vendedor existe na nossa lista
        if (vendorStatsMap.has(vendorId)) {
          const current = vendorStatsMap.get(vendorId)!;
          
          console.log(`  CORREÇÃO - Processing adjustment ${index + 1}/${allAdjustments.length}: Vendor ${current.vendedor_nome} (${vendorId})`);
          
          current.total_ajustes += 1;
          
          if (adjustment.tipo === 'adicao') {
            current.pontos_adicionados += adjustment.valor;
          } else {
            current.pontos_removidos += Math.abs(adjustment.valor);
          }

          if (new Date(adjustment.created_at) > new Date(current.ultimo_ajuste)) {
            current.ultimo_ajuste = adjustment.created_at;
          }

          vendorStatsMap.set(vendorId, current);
          console.log(`    CORREÇÃO - Updated stats for ${current.vendedor_nome}: ${current.total_ajustes} adjustments`);
        } else {
          console.log(`  ⚠️ CORREÇÃO - Adjustment found for unknown vendor ID: ${vendorId}`);
        }
      });

      // Step 5: Converter para array e ordenar
      const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
        vendedor_id: vendorId,
        vendedor_nome: stats.vendedor_nome,
        total_ajustes: stats.total_ajustes,
        pontos_adicionados: stats.pontos_adicionados,
        pontos_removidos: stats.pontos_removidos,
        ultimo_ajuste: stats.ultimo_ajuste
      })).sort((a, b) => b.total_ajustes - a.total_ajustes);

      console.log(`✅ [vendorService] CORREÇÃO - FINAL SUMMARY RESULT - Returning ${result.length} vendor summaries:`);
      result.forEach((v, index) => {
        console.log(`  ${index + 1}. ✓ ${v.vendedor_nome} (ID: ${v.vendedor_id}): ${v.total_ajustes} ajustes (+${v.pontos_adicionados}, -${v.pontos_removidos})`);
      });

      console.log('🔍 [vendorService] === ENDING VENDOR ADJUSTMENTS SUMMARY ===');
      return result;

    } catch (error) {
      console.error('❌ [vendorService] Error in getVendorAdjustmentsSummary:', error);
      toast.error('Erro ao buscar resumo de ajustes por vendedor');
      return [];
    }
  }
};
