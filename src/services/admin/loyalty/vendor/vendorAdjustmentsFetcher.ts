
import { supabase } from '@/integrations/supabase/client';

// Raw adjustment data from database (without vendor/user names)
export interface RawVendorAdjustment {
  id: string;
  vendedor_id: string;
  usuario_id: string;
  valor: number;
  tipo: string;
  motivo: string;
  created_at: string;
}

export const fetchVendorAdjustments = async (): Promise<RawVendorAdjustment[]> => {
  console.log('🔍 [vendorAdjustmentsFetcher] === CORREÇÃO DEFINITIVA - FETCH ALL VENDOR ADJUSTMENTS ===');
  console.log('🔍 [vendorAdjustmentsFetcher] Timestamp:', new Date().toISOString());
  console.log('🔍 [vendorAdjustmentsFetcher] Garantindo fetch completo dos dados');
  
  try {
    // CORREÇÃO: Query completamente explícita sem qualquer limite implícito
    const { data: allAdjustments, error: adjustmentsError } = await supabase
      .from('pontos_ajustados')
      .select(`
        id,
        vendedor_id,
        usuario_id,
        valor,
        tipo,
        motivo,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (adjustmentsError) {
      console.error('❌ [vendorAdjustmentsFetcher] ERRO CRÍTICO na query:', adjustmentsError);
      throw adjustmentsError;
    }

    const adjustmentCount = allAdjustments?.length || 0;
    console.log(`📊 [vendorAdjustmentsFetcher] SUCESSO: ${adjustmentCount} ajustes fetched`);
    
    if (adjustmentCount === 0) {
      console.warn('⚠️ [vendorAdjustmentsFetcher] ATENÇÃO: Nenhum ajuste encontrado no banco');
      return [];
    }

    // VALIDAÇÃO: Verificar integridade dos dados
    const vendorIds = new Set(allAdjustments.map(adj => adj.vendedor_id));
    console.log(`🏪 [vendorAdjustmentsFetcher] Vendedores únicos encontrados: ${vendorIds.size}`);
    console.log(`🏪 [vendorAdjustmentsFetcher] Vendor IDs: ${Array.from(vendorIds).join(', ')}`);
    
    // VALIDAÇÃO: Contagem por vendedor
    const vendorCounts = new Map<string, number>();
    allAdjustments.forEach(adj => {
      const count = vendorCounts.get(adj.vendedor_id) || 0;
      vendorCounts.set(adj.vendedor_id, count + 1);
    });
    
    console.log('📊 [vendorAdjustmentsFetcher] DISTRIBUIÇÃO POR VENDEDOR:');
    Array.from(vendorCounts.entries()).forEach(([vendorId, count]) => {
      console.log(`  - Vendor ${vendorId}: ${count} ajustes`);
    });

    // VALIDAÇÃO CRÍTICA: Verificar se temos pelo menos 2 vendedores
    if (vendorIds.size < 2) {
      console.error('🚨 [vendorAdjustmentsFetcher] PROBLEMA CRÍTICO: Menos de 2 vendedores encontrados!');
      console.log('🚨 [vendorAdjustmentsFetcher] Esperávamos pelo menos Beaba e Mais Real');
    }

    console.log(`✅ [vendorAdjustmentsFetcher] FETCH COMPLETO: ${adjustmentCount} ajustes de ${vendorIds.size} vendedores`);
    return allAdjustments;

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] ERRO FATAL no fetch:', error);
    
    // FALLBACK: Tentar query alternativa mais básica
    console.log('🔄 [vendorAdjustmentsFetcher] Tentando query de fallback...');
    try {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('pontos_ajustados')
        .select('*');
      
      if (fallbackError) {
        console.error('❌ [vendorAdjustmentsFetcher] Fallback também falhou:', fallbackError);
        throw fallbackError;
      }
      
      console.log(`🆘 [vendorAdjustmentsFetcher] Fallback SUCCESS: ${fallbackData?.length || 0} ajustes`);
      return fallbackData || [];
      
    } catch (fallbackErr) {
      console.error('❌ [vendorAdjustmentsFetcher] Todas as queries falharam:', fallbackErr);
      throw fallbackErr;
    }
  }
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log('🏪 [vendorAdjustmentsFetcher] === CORREÇÃO DEFINITIVA - FETCH VENDOR DATA ===');
  console.log('🏪 [vendorAdjustmentsFetcher] Vendor IDs solicitados:', vendorIds);
  console.log('🏪 [vendorAdjustmentsFetcher] Quantidade:', vendorIds.length);
  
  if (vendorIds.length === 0) {
    console.warn('⚠️ [vendorAdjustmentsFetcher] ATENÇÃO: Lista de vendor IDs vazia');
    return [];
  }
  
  try {
    // CORREÇÃO: Query mais robusta para vendedores
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        status,
        usuario_id,
        created_at
      `)
      .in('id', vendorIds);

    if (vendorsError) {
      console.error('❌ [vendorAdjustmentsFetcher] ERRO ao buscar vendedores:', vendorsError);
      throw vendorsError;
    }

    const foundCount = vendorsData?.length || 0;
    console.log(`🏪 [vendorAdjustmentsFetcher] VENDEDORES ENCONTRADOS: ${foundCount}/${vendorIds.length}`);
    
    // VALIDAÇÃO CRÍTICA: Verificar vendedores missing
    const foundVendorIds = new Set(vendorsData?.map(v => v.id) || []);
    const missingVendorIds = vendorIds.filter(id => !foundVendorIds.has(id));
    
    if (missingVendorIds.length > 0) {
      console.error('🚨 [vendorAdjustmentsFetcher] VENDEDORES MISSING:', missingVendorIds);
      console.error('🚨 [vendorAdjustmentsFetcher] Isso causará perda de dados!');
    }
    
    // LOG detalhado de cada vendedor
    if (vendorsData && vendorsData.length > 0) {
      console.log('🏪 [vendorAdjustmentsFetcher] DETALHES DOS VENDEDORES:');
      vendorsData.forEach((vendor, index) => {
        const nameLower = vendor.nome_loja?.toLowerCase().trim() || '';
        console.log(`  ${index + 1}. ID: ${vendor.id}, Nome: "${vendor.nome_loja}", Status: ${vendor.status}`);
        
        if (nameLower.includes('mais real')) {
          console.log(`    🎯 MAIS REAL CONFIRMADO!`);
        }
        if (nameLower.includes('beaba')) {
          console.log(`    🎯 BEABA CONFIRMADO!`);
        }
      });
    }

    console.log(`✅ [vendorAdjustmentsFetcher] VENDOR FETCH COMPLETO: ${foundCount} vendedores`);
    return vendorsData || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] ERRO FATAL ao buscar vendedores:', error);
    throw error;
  }
};

export const fetchUsersForAdjustments = async (userIds: string[]) => {
  console.log('👥 [vendorAdjustmentsFetcher] === FETCH USER DATA ===');
  console.log(`👥 [vendorAdjustmentsFetcher] Buscando ${userIds.length} usuários`);
  
  if (userIds.length === 0) {
    console.log('⚠️ [vendorAdjustmentsFetcher] Lista de user IDs vazia');
    return [];
  }
  
  try {
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        nome,
        email
      `)
      .in('id', userIds);

    if (usersError) {
      console.error('❌ [vendorAdjustmentsFetcher] Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    const foundCount = usersData?.length || 0;
    console.log(`👥 [vendorAdjustmentsFetcher] USUÁRIOS ENCONTRADOS: ${foundCount}/${userIds.length}`);
    
    // Verificar usuários missing
    const foundUserIds = new Set(usersData?.map(u => u.id) || []);
    const missingUserIds = userIds.filter(id => !foundUserIds.has(id));
    
    if (missingUserIds.length > 0) {
      console.warn('⚠️ [vendorAdjustmentsFetcher] Usuários não encontrados:', missingUserIds.length);
    }

    return usersData || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] Erro ao buscar usuários:', error);
    throw error;
  }
};
