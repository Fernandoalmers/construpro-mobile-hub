
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/admin';

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    console.log('🚀 [fetchUsers] INICIANDO BUSCA CORRIGIDA v3.0...');
    
    // 1. Buscar todos os profiles primeiro
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error('❌ [fetchUsers] Erro ao buscar profiles:', profilesError);
      throw profilesError;
    }

    console.log('✅ [fetchUsers] Profiles encontrados:', profiles?.length || 0);
    
    // 2. Buscar todos os referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*');

    if (referralsError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar referrals:', referralsError);
    }

    console.log('✅ [fetchUsers] Referrals encontrados:', referrals?.length || 0);

    // 3. Buscar dados de compras (orders)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('cliente_id, valor_total');

    if (ordersError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar orders:', ordersError);
    }

    console.log('✅ [fetchUsers] Orders encontradas:', orders?.length || 0);

    // 4. Criar mapas para facilitar o lookup
    const referralsMap = new Map();
    const profilesMap = new Map();
    
    // Mapear profiles por ID para lookup rápido
    (profiles || []).forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Mapear referrals: quem foi indicado por quem
    (referrals || []).forEach(referral => {
      referralsMap.set(referral.referred_id, referral.referrer_id);
    });

    // Agrupar compras por cliente
    const purchasesByClient = (orders || []).reduce((acc, order) => {
      if (!acc[order.cliente_id]) {
        acc[order.cliente_id] = 0;
      }
      acc[order.cliente_id] += order.valor_total || 0;
      return acc;
    }, {} as Record<string, number>);

    console.log('✅ [fetchUsers] Dados de compras processados para', Object.keys(purchasesByClient).length, 'clientes');

    // 5. Processar cada usuário
    const enrichedUsers = (profiles || []).map((user) => {
      // Buscar quem indicou este usuário
      const referrerId = referralsMap.get(user.id);
      const referrerProfile = referrerId ? profilesMap.get(referrerId) : null;
      const indicadoPor = referrerProfile?.nome || '';
      
      // Calcular total de compras
      const totalCompras = purchasesByClient[user.id] || 0;

      // Mapear campos corretamente
      const codigoIndicacao = user.codigo || '';
      const especialidade = user.especialidade_profissional || '';

      console.log(`👤 [fetchUsers] Processando: ${user.nome}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Código: "${codigoIndicacao}"`);
      console.log(`   - Indicado por: "${indicadoPor}"`);
      console.log(`   - Especialidade: "${especialidade}"`);
      console.log(`   - Total compras: R$ ${totalCompras.toFixed(2)}`);

      // RETORNAR OBJETO COMPLETO COM TODOS OS CAMPOS NECESSÁRIOS
      return {
        id: user.id,
        nome: user.nome || 'Sem nome',
        email: user.email || 'Sem email',
        papel: user.papel || user.tipo_perfil || 'consumidor',
        tipo_perfil: user.tipo_perfil || user.papel || 'consumidor',
        status: user.status || 'ativo',
        cpf: user.cpf || '',
        telefone: user.telefone || '',
        avatar: user.avatar || null,
        is_admin: user.is_admin || false,
        saldo_pontos: user.saldo_pontos || 0,
        created_at: user.created_at,
        // CAMPOS ESSENCIAIS QUE ESTAVAM FALTANDO
        codigo_indicacao: codigoIndicacao,
        indicado_por: indicadoPor,
        especialidade: especialidade,
        total_compras: totalCompras
      } as UserData;
    });
    
    console.log('✅ [fetchUsers] TOTAL de usuários processados:', enrichedUsers.length);
    
    // Log dos primeiros usuários para verificação final
    enrichedUsers.slice(0, 3).forEach((user, index) => {
      console.log(`🔍 [fetchUsers] Usuário ${index + 1} FINAL:`);
      console.log(`   Nome: ${user.nome}`);
      console.log(`   Código: "${user.codigo_indicacao}"`);
      console.log(`   Indicado por: "${user.indicado_por}"`);
      console.log(`   Especialidade: "${user.especialidade}"`);
      console.log(`   Total compras: R$ ${user.total_compras?.toFixed(2) || '0.00'}`);
    });
    
    return enrichedUsers;
  } catch (error) {
    console.error('❌ [fetchUsers] Erro geral:', error);
    throw error;
  }
};
