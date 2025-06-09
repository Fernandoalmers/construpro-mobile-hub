
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustment, VendorAdjustmentSummary } from './types';

export const vendorService = {
  async getVendorAdjustments(limit?: number): Promise<VendorAdjustment[]> {
    try {
      console.log('🔍 [vendorService] Starting getVendorAdjustments - fetching ALL adjustments...');
      
      // Step 1: Get ALL adjustments without any limit (same as getVendorAdjustmentsSummary)
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

      // Step 2: Get ALL vendor data and filter for active/approved vendors (same logic as summary)
      console.log('🏪 [vendorService] Fetching ALL vendors from database...');
      const { data: allVendors, error: allVendorsError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, status');

      if (allVendorsError) {
        console.error('❌ [vendorService] Error fetching all vendors:', allVendorsError);
        throw allVendorsError;
      }

      console.log(`🏪 [vendorService] Retrieved ${allVendors?.length || 0} total vendors from database`);
      console.log('🏪 [vendorService] All vendor statuses:', allVendors?.map(v => ({ id: v.id, nome: v.nome_loja, status: v.status })));

      // Filter for active/approved vendors that also have adjustments (same logic as summary)
      const vendorsWithAdjustments = allVendors?.filter(v => {
        const hasAdjustments = vendorIdsInAdjustments.includes(v.id);
        const isActiveOrApproved = v.status === 'ativo' || v.status === 'aprovado';
        
        console.log(`🔍 [vendorService] Vendor ${v.nome_loja} (${v.id}): status=${v.status}, hasAdjustments=${hasAdjustments}, isActiveOrApproved=${isActiveOrApproved}`);
        
        return hasAdjustments && isActiveOrApproved;
      }) || [];

      console.log(`🏪 [vendorService] Found ${vendorsWithAdjustments.length} vendors with adjustments and active/approved status:`);
      vendorsWithAdjustments.forEach(v => {
        console.log(`  - ${v.nome_loja} (${v.id}) - Status: ${v.status}`);
      });

      if (vendorsWithAdjustments.length === 0) {
        console.log('⚠️ [vendorService] No active/approved vendors with adjustments found');
        return [];
      }

      // Step 3: Filter adjustments for active vendors only (same logic as summary)
      const activeVendorIds = new Set(vendorsWithAdjustments.map(v => v.id));
      const filteredAdjustments = allAdjustments.filter(adj => 
        activeVendorIds.has(adj.vendedor_id)
      );

      console.log(`📊 [vendorService] ${filteredAdjustments.length} adjustments for active vendors`);
      
      // Group adjustments by vendor for detailed logging
      const adjustmentsByVendor = new Map<string, number>();
      filteredAdjustments.forEach(adj => {
        const count = adjustmentsByVendor.get(adj.vendedor_id) || 0;
        adjustmentsByVendor.set(adj.vendedor_id, count + 1);
      });

      console.log('📊 [vendorService] Adjustments per vendor (getVendorAdjustments):');
      Array.from(adjustmentsByVendor.entries()).forEach(([vendorId, count]) => {
        const vendor = vendorsWithAdjustments.find(v => v.id === vendorId);
        console.log(`  - ${vendor?.nome_loja || vendorId}: ${count} adjustments`);
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
      const vendorNameMap = new Map(vendorsWithAdjustments.map(v => [v.id, v.nome_loja]));
      const userMap = new Map(usersData?.map(u => [u.id, u.nome]) || []);

      const result = filteredAdjustments.map(adjustment => ({
        ...adjustment,
        vendedor_nome: vendorNameMap.get(adjustment.vendedor_id) || 'Vendedor desconhecido',
        usuario_nome: userMap.get(adjustment.usuario_id) || 'Usuário desconhecido'
      }));

      console.log(`✅ [vendorService] Returning ${result.length} processed adjustments from getVendorAdjustments`);
      
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
      console.log('🔍 [vendorService] Starting vendor adjustments summary fetch...');

      // Step 1: Get ALL adjustments without any limit
      console.log('📊 [vendorService] Fetching ALL adjustments from database (no limit)...');
      const { data: allAdjustments, error: adjustmentsError } = await supabase
        .from('pontos_ajustados')
        .select('vendedor_id, tipo, valor, created_at')
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

      // Step 2: Get ALL vendor data and filter for active/approved vendors
      console.log('🏪 [vendorService] Fetching ALL vendors from database...');
      const { data: allVendors, error: allVendorsError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, status');

      if (allVendorsError) {
        console.error('❌ [vendorService] Error fetching all vendors:', allVendorsError);
        throw allVendorsError;
      }

      console.log(`🏪 [vendorService] Retrieved ${allVendors?.length || 0} total vendors from database`);
      console.log('🏪 [vendorService] All vendor statuses:', allVendors?.map(v => ({ id: v.id, nome: v.nome_loja, status: v.status })));

      // Filter for active/approved vendors that also have adjustments
      const vendorsWithAdjustments = allVendors?.filter(v => {
        const hasAdjustments = vendorIdsInAdjustments.includes(v.id);
        const isActiveOrApproved = v.status === 'ativo' || v.status === 'aprovado';
        
        console.log(`🔍 [vendorService] Vendor ${v.nome_loja} (${v.id}): status=${v.status}, hasAdjustments=${hasAdjustments}, isActiveOrApproved=${isActiveOrApproved}`);
        
        return hasAdjustments && isActiveOrApproved;
      }) || [];

      console.log(`🏪 [vendorService] Found ${vendorsWithAdjustments.length} vendors with adjustments and active/approved status:`);
      vendorsWithAdjustments.forEach(v => {
        console.log(`  - ${v.nome_loja} (${v.id}) - Status: ${v.status}`);
      });

      if (vendorsWithAdjustments.length === 0) {
        console.log('⚠️ [vendorService] No active/approved vendors with adjustments found');
        return [];
      }

      // Step 3: Filter adjustments for active vendors only
      const activeVendorIds = new Set(vendorsWithAdjustments.map(v => v.id));
      const filteredAdjustments = allAdjustments.filter(adj => 
        activeVendorIds.has(adj.vendedor_id)
      );

      console.log(`📊 [vendorService] ${filteredAdjustments.length} adjustments for active vendors`);
      
      // Group adjustments by vendor for detailed logging
      const adjustmentsByVendor = new Map<string, number>();
      filteredAdjustments.forEach(adj => {
        const count = adjustmentsByVendor.get(adj.vendedor_id) || 0;
        adjustmentsByVendor.set(adj.vendedor_id, count + 1);
      });

      console.log('📊 [vendorService] Adjustments per vendor (getVendorAdjustmentsSummary):');
      Array.from(adjustmentsByVendor.entries()).forEach(([vendorId, count]) => {
        const vendor = vendorsWithAdjustments.find(v => v.id === vendorId);
        console.log(`  - ${vendor?.nome_loja || vendorId}: ${count} adjustments`);
      });

      // Step 4: Create vendor name map and calculate statistics
      const vendorNameMap = new Map(vendorsWithAdjustments.map(v => [v.id, v.nome_loja]));
      const vendorStatsMap = new Map<string, {
        vendedor_nome: string;
        total_ajustes: number;
        pontos_adicionados: number;
        pontos_removidos: number;
        ultimo_ajuste: string;
      }>();

      filteredAdjustments.forEach(adjustment => {
        const vendorId = adjustment.vendedor_id;
        const vendorName = vendorNameMap.get(vendorId) || 'Vendedor desconhecido';
        
        const current = vendorStatsMap.get(vendorId) || {
          vendedor_nome: vendorName,
          total_ajustes: 0,
          pontos_adicionados: 0,
          pontos_removidos: 0,
          ultimo_ajuste: adjustment.created_at
        };

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
      });

      // Step 5: Convert to array and sort by total adjustments
      const result = Array.from(vendorStatsMap.entries()).map(([vendorId, stats]) => ({
        vendedor_id: vendorId,
        vendedor_nome: stats.vendedor_nome,
        total_ajustes: stats.total_ajustes,
        pontos_adicionados: stats.pontos_adicionados,
        pontos_removidos: stats.pontos_removidos,
        ultimo_ajuste: stats.ultimo_ajuste
      })).sort((a, b) => b.total_ajustes - a.total_ajustes);

      console.log(`✅ [vendorService] Returning ${result.length} vendor summaries:`);
      result.forEach(v => {
        console.log(`  - ${v.vendedor_nome}: ${v.total_ajustes} ajustes (+${v.pontos_adicionados}, -${v.pontos_removidos})`);
      });

      return result;

    } catch (error) {
      console.error('❌ [vendorService] Error in getVendorAdjustmentsSummary:', error);
      toast.error('Erro ao buscar resumo de ajustes por vendedor');
      return [];
    }
  }
};
