
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/admin';

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    console.log('🚀 [fetchUsers] VERSÃO CORRIGIDA - Iniciando busca de usuários...');
    
    // Query única com JOINs para buscar todos os dados de uma vez
    const { data: usersWithReferrals, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        referrals_referred:referrals!referred_id (
          referrer_id,
          referrer:profiles!referrer_id (
            nome
          )
        )
      `)
      .order('created_at', { ascending: false });
      
    if (usersError) {
      console.error('❌ [fetchUsers] Erro ao buscar profiles:', usersError);
      throw usersError;
    }

    console.log('✅ [fetchUsers] Dados encontrados:', usersWithReferrals?.length || 0);
    
    // Buscar dados de compras (orders)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('cliente_id, valor_total');

    if (ordersError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar orders:', ordersError);
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
    const enrichedUsers = (usersWithReferrals || []).map((user) => {
      // Buscar quem indicou este usuário
      const referralData = user.referrals_referred?.[0];
      const indicadoPor = referralData?.referrer?.nome || '';
      
      // Calcular total de compras
      const totalCompras = purchasesByClient[user.id] || 0;

      // Log detalhado para cada usuário
      console.log(`👤 [fetchUsers] Processando: ${user.nome}`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Código indicação: "${user.codigo || 'SEM CÓDIGO'}"`);
      console.log(`   - Indicado por: "${indicadoPor || 'NINGUÉM'}"`);
      console.log(`   - Especialidade: "${user.especialidade_profissional || 'SEM ESPECIALIDADE'}"`);
      console.log(`   - Total compras: R$ ${totalCompras.toFixed(2)}`);
      console.log(`   - Status: ${user.status || 'ativo'}`);
      console.log(`   - Papel: ${user.papel || user.tipo_perfil || 'consumidor'}`);

      const processedUser: UserData = {
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
        // CAMPOS CORRIGIDOS - ESTES SÃO OS CAMPOS QUE ESTAVAM FALTANDO
        codigo_indicacao: user.codigo || '',
        indicado_por: indicadoPor,
        especialidade: user.especialidade_profissional || '',
        total_compras: totalCompras
      };

      // Log do resultado final para este usuário
      console.log(`✅ [fetchUsers] Usuário processado:`, {
        nome: processedUser.nome,
        codigo_indicacao: processedUser.codigo_indicacao,
        indicado_por: processedUser.indicado_por,
        especialidade: processedUser.especialidade,
        total_compras: processedUser.total_compras
      });

      return processedUser;
    });
    
    console.log('✅ [fetchUsers] TOTAL de usuários processados:', enrichedUsers.length);
    
    // Log dos primeiros usuários para verificação
    enrichedUsers.slice(0, 3).forEach((user, index) => {
      console.log(`🔍 [fetchUsers] Usuário ${index + 1}:`);
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
