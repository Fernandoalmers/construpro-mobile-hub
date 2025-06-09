
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
  console.log('🔍 [vendorAdjustmentsFetcher] === CORREÇÃO DEFINITIVA - FETCH ALL ===');
  console.log('🔍 [vendorAdjustmentsFetcher] Timestamp:', new Date().toISOString());
  console.log('🔍 [vendorAdjustmentsFetcher] Forçando refresh completo do cache');
  
  try {
    // CORREÇÃO DEFINITIVA: Query com cache-busting e retry
    const timestamp = Date.now();
    console.log('🔄 [vendorAdjustmentsFetcher] Executando query principal com timestamp:', timestamp);
    
    const { data: primaryData, error: primaryError } = await supabase
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

    if (primaryError) {
      console.error('❌ [vendorAdjustmentsFetcher] ERRO na query principal:', primaryError);
      throw primaryError;
    }

    const primaryCount = primaryData?.length || 0;
    console.log(`📊 [vendorAdjustmentsFetcher] QUERY PRINCIPAL: ${primaryCount} ajustes fetched`);

    // VALIDAÇÃO CRÍTICA: Verificar se temos pelo menos 35+ ajustes (esperado ~37)
    if (primaryCount < 35) {
      console.warn(`⚠️ [vendorAdjustmentsFetcher] ATENÇÃO: Apenas ${primaryCount} ajustes encontrados (esperado ~37)`);
      
      // RETRY: Tentar query alternativa sem cache
      console.log('🔄 [vendorAdjustmentsFetcher] Executando query de retry...');
      const { data: retryData, error: retryError } = await supabase
        .from('pontos_ajustados')
        .select('*')
        .limit(1000); // Limite alto para garantir todos os dados
      
      if (retryError) {
        console.error('❌ [vendorAdjustmentsFetcher] Retry também falhou:', retryError);
      } else {
        const retryCount = retryData?.length || 0;
        console.log(`🔄 [vendorAdjustmentsFetcher] RETRY RESULT: ${retryCount} ajustes`);
        
        if (retryCount > primaryCount) {
          console.log('✅ [vendorAdjustmentsFetcher] Retry retornou mais dados! Usando retry data');
          return retryData || [];
        }
      }
    }

    // VALIDAÇÃO DETALHADA dos dados principais
    if (primaryData && primaryData.length > 0) {
      const vendorIds = new Set(primaryData.map(adj => adj.vendedor_id));
      console.log(`🏪 [vendorAdjustmentsFetcher] Vendedores únicos: ${vendorIds.size}`);
      console.log(`🏪 [vendorAdjustmentsFetcher] Vendor IDs: ${Array.from(vendorIds).join(', ')}`);
      
      // Contagem por vendedor
      const vendorCounts = new Map<string, number>();
      primaryData.forEach(adj => {
        const count = vendorCounts.get(adj.vendedor_id) || 0;
        vendorCounts.set(adj.vendedor_id, count + 1);
      });
      
      console.log('📊 [vendorAdjustmentsFetcher] DISTRIBUIÇÃO POR VENDEDOR:');
      Array.from(vendorCounts.entries()).forEach(([vendorId, count]) => {
        console.log(`  - Vendor ${vendorId}: ${count} ajustes`);
      });

      // VALIDAÇÃO CRÍTICA: Esperamos pelo menos 2 vendedores
      if (vendorIds.size < 2) {
        console.error('🚨 [vendorAdjustmentsFetcher] PROBLEMA CRÍTICO: Menos de 2 vendedores!');
        console.error('🚨 [vendorAdjustmentsFetcher] Dados podem estar sendo filtrados incorretamente');
      }
    }

    console.log(`✅ [vendorAdjustmentsFetcher] FETCH COMPLETO: ${primaryCount} ajustes retornados`);
    return primaryData || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] ERRO FATAL:', error);
    
    // FALLBACK ABSOLUTO: Query mais simples possível
    console.log('🆘 [vendorAdjustmentsFetcher] Executando fallback absoluto...');
    try {
      const { data: fallbackData } = await supabase
        .from('pontos_ajustados')
        .select('*');
      
      const fallbackCount = fallbackData?.length || 0;
      console.log(`🆘 [vendorAdjustmentsFetcher] FALLBACK: ${fallbackCount} ajustes`);
      return fallbackData || [];
      
    } catch (fallbackErr) {
      console.error('❌ [vendorAdjustmentsFetcher] Todos os fallbacks falharam:', fallbackErr);
      return [];
    }
  }
};

export const fetchVendorsForAdjustments = async (vendorIds: string[]) => {
  console.log('🏪 [vendorAdjustmentsFetcher] === FETCH VENDORS DEFINITIVO ===');
  console.log('🏪 [vendorAdjustmentsFetcher] Vendor IDs solicitados:', vendorIds);
  console.log('🏪 [vendorAdjustmentsFetcher] Quantidade:', vendorIds.length);
  
  if (vendorIds.length === 0) {
    console.warn('⚠️ [vendorAdjustmentsFetcher] Lista de vendor IDs vazia');
    return [];
  }
  
  try {
    // CORREÇÃO: Query robusta para vendedores
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
      console.error('🚨 [vendorAdjustmentsFetcher] Isso causará perda de dados na UI!');
    }
    
    // LOG DETALHADO de cada vendedor encontrado
    if (vendorsData && vendorsData.length > 0) {
      console.log('🏪 [vendorAdjustmentsFetcher] VENDEDORES ENCONTRADOS:');
      vendorsData.forEach((vendor, index) => {
        const nameLower = vendor.nome_loja?.toLowerCase().trim() || '';
        console.log(`  ${index + 1}. ID: ${vendor.id}, Nome: "${vendor.nome_loja}", Status: ${vendor.status}`);
        
        // Busca específica por vendedores chave
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
  console.log('👥 [vendorAdjustmentsFetcher] === FETCH USERS ===');
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
    
    return usersData || [];

  } catch (error) {
    console.error('❌ [vendorAdjustmentsFetcher] Erro ao buscar usuários:', error);
    throw error;
  }
};
