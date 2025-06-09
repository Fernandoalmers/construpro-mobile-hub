
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorAdjustment, VendorAdjustmentSummary } from './types';

export const vendorService = {
  async getVendorAdjustments(limit = 20): Promise<VendorAdjustment[]> {
    try {
      console.log('🔍 [vendorService] Fetching vendor adjustments...');
      
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

      console.log(`🏪 [vendorService] Found ${vendorIds.length} unique vendor IDs:`, vendorIds);

      const [vendorsData, usersData] = await Promise.all([
        supabase.from('vendedores').select('id, nome_loja, status').in('id', vendorIds),
        supabase.from('profiles').select('id, nome').in('id', userIds)
      ]);

      console.log(`🏪 [vendorService] Vendors data:`, vendorsData.data);
      console.log(`👥 [vendorService] Users data:`, usersData.data);

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
      console.log('🔍 [vendorService] Fetching vendor adjustments summary with proper filtering...');

      // Use a single query with JOIN to get vendor adjustments with active vendor filtering
      const { data: adjustmentsWithVendors, error } = await supabase
        .from('pontos_ajustados')
        .select(`
          vendedor_id,
          tipo,
          valor,
          created_at,
          vendedores!inner(
            id,
            nome_loja,
            status
          )
        `)
        .in('vendedores.status', ['ativo', 'aprovado']);

      if (error) {
        console.error('❌ [vendorService] Error fetching vendor adjustments with vendors:', error);
        throw error;
      }

      console.log(`📊 [vendorService] Found ${adjustmentsWithVendors?.length || 0} adjustments from active/approved vendors`);

      if (!adjustmentsWithVendors || adjustmentsWithVendors.length === 0) {
        console.log('⚠️ [vendorService] No adjustments found for active/approved vendors');
        return [];
      }

      // Log vendor statuses for debugging
      const uniqueVendors = [...new Set(adjustmentsWithVendors.map(a => a.vendedor_id))];
      console.log(`🏪 [vendorService] Processing ${uniqueVendors.length} unique vendors from adjustments`);
      
      // Group and calculate statistics by vendor
      const vendorStatsMap = new Map<string, {
        vendedor_nome: string;
        total_ajustes: number;
        pontos_adicionados: number;
        pontos_removidos: number;
        ultimo_ajuste: string;
      }>();

      adjustmentsWithVendors.forEach(adjustment => {
        const vendorId = adjustment.vendedor_id;
        const vendorName = adjustment.vendedores?.nome_loja || 'Vendedor desconhecido';
        
        console.log(`🔄 [vendorService] Processing adjustment for vendor: ${vendorName} (${vendorId}), status: ${adjustment.vendedores?.status}`);
        
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

        // Update last adjustment date if this one is more recent
        if (new Date(adjustment.created_at) > new Date(current.ultimo_ajuste)) {
          current.ultimo_ajuste = adjustment.created_at;
        }

        vendorStatsMap.set(vendorId, current);
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

      console.log(`✅ [vendorService] Returning summary for ${result.length} vendors:`, result.map(v => `${v.vendedor_nome} (${v.total_ajustes} ajustes)`));
      return result;

    } catch (error) {
      console.error('❌ [vendorService] Error fetching vendor adjustments summary:', error);
      toast.error('Erro ao buscar resumo de ajustes por vendedor');
      return [];
    }
  }
};
