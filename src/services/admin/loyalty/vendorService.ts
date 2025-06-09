
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustment, VendorAdjustmentSummary } from './types';

export const vendorService = {
  async getVendorAdjustments(limit = 50): Promise<VendorAdjustment[]> {
    try {
      console.log('🔍 [vendorService] Fetching vendor adjustments with limit:', limit);
      
      const { data: adjustments, error } = await supabase
        .from('pontos_ajustados')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      console.log(`📊 [vendorService] Found ${adjustments?.length || 0} total adjustments`);

      // Buscar nomes dos vendedores e usuários
      const vendorIds = [...new Set(adjustments?.map(a => a.vendedor_id) || [])];
      const userIds = [...new Set(adjustments?.map(a => a.usuario_id) || [])];

      console.log('🏪 [vendorService] Unique vendor IDs in adjustments:', vendorIds);
      console.log('👥 [vendorService] Unique user IDs in adjustments:', userIds);

      const [vendorsData, usersData] = await Promise.all([
        supabase.from('vendedores').select('id, nome_loja, status').in('id', vendorIds),
        supabase.from('profiles').select('id, nome').in('id', userIds)
      ]);

      console.log('🏪 [vendorService] Vendors data from DB:', vendorsData.data?.map(v => ({ id: v.id, nome: v.nome_loja, status: v.status })));

      const vendorMap = new Map(vendorsData.data?.map(v => [v.id, { nome: v.nome_loja, status: v.status }]) || []);
      const userMap = new Map(usersData.data?.map(u => [u.id, u.nome]) || []);

      const result = adjustments?.map(adjustment => ({
        ...adjustment,
        vendedor_nome: vendorMap.get(adjustment.vendedor_id)?.nome || 'Vendedor desconhecido',
        usuario_nome: userMap.get(adjustment.usuario_id) || 'Usuário desconhecido'
      })) || [];

      console.log(`✅ [vendorService] Returning ${result.length} processed adjustments`);
      return result;
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

      console.log('📊 [vendorService] Adjustments per vendor:');
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
