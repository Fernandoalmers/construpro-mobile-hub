
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
    
    // Buscar dados de referrals separadamente
    const { data: referralsData, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        referred_id,
        referrer:profiles!referrals_referrer_id_fkey(nome)
      `);

    if (referralsError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar referrals:', referralsError);
    }

    // Criar um mapa de referrals para facilitar a busca
    const referralsMap = (referralsData || []).reduce((acc, referral) => {
      acc[referral.referred_id] = referral.referrer?.nome || '';
      return acc;
    }, {} as Record<string, string>);

    console.log('✅ [fetchUsers] Referrals processados:', Object.keys(referralsMap).length);
    
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

      console.log(`👤 [fetchUsers] Processando usuário ${user.nome}: codigo="${user.codigo || ''}", indicado_por="${indicadoPor}", especialidade="${user.especialidade_profissional || ''}", total_compras=${totalCompras}`);

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
        // Campos específicos que estavam faltando
        codigo_indicacao: user.codigo || '',
        indicado_por: indicadoPor,
        especialidade: user.especialidade_profissional || '',
        total_compras: totalCompras
      };
    });
    
    console.log('✅ [fetchUsers] Usuários processados com sucesso:', enrichedUsers.length);
    console.log('🔍 [fetchUsers] Exemplo de dados processados:', enrichedUsers.slice(0, 2));
    
    return enrichedUsers;
  } catch (error) {
    console.error('❌ [fetchUsers] Erro geral:', error);
    throw error;
  }
};
