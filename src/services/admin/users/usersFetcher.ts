
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/admin';

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    console.log('🔍 [fetchUsers] Iniciando busca de usuários com dados completos...');
    
    // Buscar todos os dados dos usuários primeiro
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (usersError) {
      console.error('❌ [fetchUsers] Erro ao buscar profiles:', usersError);
      throw usersError;
    }

    console.log('✅ [fetchUsers] Profiles encontrados:', usersData?.length || 0);
    
    // Buscar dados de referrals separadamente - query simplificada
    const { data: referralsData, error: referralsError } = await supabase
      .from('referrals')
      .select('referred_id, referrer_id');

    if (referralsError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar referrals:', referralsError);
    }

    console.log('✅ [fetchUsers] Referrals encontrados:', referralsData?.length || 0);

    // Buscar nomes dos indicadores separadamente
    const referrerIds = referralsData?.map(r => r.referrer_id).filter(Boolean) || [];
    let referrersData: any[] = [];
    
    if (referrerIds.length > 0) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', referrerIds);
        
      if (!error && data) {
        referrersData = data;
      }
    }

    // Criar mapa de referrals para facilitar a busca
    const referralsMap = (referralsData || []).reduce((acc, referral) => {
      const referrerName = referrersData.find(r => r.id === referral.referrer_id)?.nome || '';
      acc[referral.referred_id] = referrerName;
      return acc;
    }, {} as Record<string, string>);

    console.log('✅ [fetchUsers] Referrals processados:', Object.keys(referralsMap).length);
    console.log('🔍 [fetchUsers] Mapa de referrals:', referralsMap);
    
    // Buscar dados de compras de forma otimizada
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('cliente_id, valor_total');

    if (ordersError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar orders (continuando sem dados de compras):', ordersError);
    }

    // Agrupar compras por cliente
    const purchasesByClient = (ordersData || []).reduce((acc, order) => {
      if (!acc[order.cliente_id]) {
        acc[order.cliente_id] = 0;
      }
      acc[order.cliente_id] += order.valor_total || 0;
      return acc;
    }, {} as Record<string, number>);

    console.log('✅ [fetchUsers] Dados de compras processados para', Object.keys(purchasesByClient).length, 'clientes');

    // Processar dados dos usuários
    const enrichedUsers = usersData.map((user) => {
      // Buscar dados de referência no mapa
      const indicadoPor = referralsMap[user.id] || '';

      // Calcular total de compras
      const totalCompras = purchasesByClient[user.id] || 0;

      console.log(`👤 [fetchUsers] Processando usuário ${user.nome}:`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Código: "${user.codigo || ''}"`);
      console.log(`   - Indicado por: "${indicadoPor}"`);
      console.log(`   - Especialidade: "${user.especialidade_profissional || ''}"`);
      console.log(`   - Total compras: R$ ${totalCompras.toFixed(2)}`);

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
        // Campos específicos que estavam faltando - corrigidos
        codigo_indicacao: user.codigo || '',
        indicado_por: indicadoPor,
        especialidade: user.especialidade_profissional || '',
        total_compras: totalCompras
      };
    });
    
    console.log('✅ [fetchUsers] Usuários processados com sucesso:', enrichedUsers.length);
    console.log('🔍 [fetchUsers] Exemplo de dados processados (primeiros 2):');
    enrichedUsers.slice(0, 2).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nome}: código="${user.codigo_indicacao}", indicado_por="${user.indicado_por}", especialidade="${user.especialidade}", total_compras=R$${user.total_compras.toFixed(2)}`);
    });
    
    return enrichedUsers;
  } catch (error) {
    console.error('❌ [fetchUsers] Erro geral:', error);
    throw error;
  }
};
