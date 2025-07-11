
import { supabase } from '@/integrations/supabase/client';
import { UserData } from '@/types/admin';

export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    console.log('🚀 [fetchUsers] VERSÃO DEBUG v8.0 - CORRIGINDO REFERRALS PENDENTES...');
    
    // 1. Buscar todos os profiles primeiro
    console.log('📊 [fetchUsers] Buscando profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profilesError) {
      console.error('❌ [fetchUsers] Erro ao buscar profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ [fetchUsers] Nenhum profile encontrado');
      return [];
    }

    console.log(`✅ [fetchUsers] ${profiles.length} profiles encontrados`);
    
    // 2. CORREÇÃO: Buscar TODOS os referrals incluindo pendentes
    console.log('📊 [fetchUsers] Buscando referrals (INCLUINDO PENDENTES)...');
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .in('status', ['pendente', 'aprovado', 'rejeitado']); // Incluir explicitamente todos os status

    if (referralsError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar referrals:', referralsError);
    }

    console.log(`✅ [fetchUsers] ${referrals?.length || 0} referrals encontrados (incluindo pendentes)`);
    
    // LOG DETALHADO DOS REFERRALS COM FOCO EM PENDENTES
    if (referrals && referrals.length > 0) {
      console.log('🔍 [fetchUsers] TODOS OS REFERRALS ENCONTRADOS (incluindo pendentes):');
      const pendentesCount = referrals.filter(ref => ref.status === 'pendente').length;
      const aprovadosCount = referrals.filter(ref => ref.status === 'aprovado').length;
      
      console.log(`   📊 CONTADORES: ${aprovadosCount} aprovados, ${pendentesCount} pendentes`);
      
      referrals.forEach((ref, index) => {
        console.log(`   ${index + 1}. ID: ${ref.id}`);
        console.log(`      Referrer: ${ref.referrer_id}`);
        console.log(`      Referred: ${ref.referred_id}`);
        console.log(`      Status: ${ref.status} ${ref.status === 'pendente' ? '🟡 PENDENTE!' : ref.status === 'aprovado' ? '🟢' : '🔴'}`);
        console.log(`      Data: ${ref.data}`);
        console.log(`      ----`);
      });
    }

    // 3. Buscar dados de compras (orders)
    console.log('📊 [fetchUsers] Buscando orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('cliente_id, valor_total');

    if (ordersError) {
      console.warn('⚠️ [fetchUsers] Erro ao buscar orders:', ordersError);
    }

    console.log(`✅ [fetchUsers] ${orders?.length || 0} orders encontradas`);

    // 4. Criar mapas para lookup rápido COM LOGS DETALHADOS
    console.log('🔄 [fetchUsers] Criando mapas de dados...');
    
    // Mapa de referrals: quem foi indicado por quem (INCLUINDO PENDENTES)
    const referralsMap = new Map<string, string>();
    if (referrals && referrals.length > 0) {
      referrals.forEach(referral => {
        if (referral.referred_id && referral.referrer_id) {
          referralsMap.set(referral.referred_id, referral.referrer_id);
          console.log(`🔗 [fetchUsers] Mapeamento: ${referral.referred_id} -> ${referral.referrer_id} (Status: ${referral.status})`);
        }
      });
    }
    console.log(`📍 [fetchUsers] Mapa de referrals criado: ${referralsMap.size} entradas`);

    // Mapa de profiles para lookup rápido
    const profilesMap = new Map<string, any>();
    profiles.forEach(profile => {
      if (profile.id) {
        profilesMap.set(profile.id, profile);
      }
    });
    console.log(`📍 [fetchUsers] Mapa de profiles criado: ${profilesMap.size} entradas`);

    // RASTREAMENTO ULTRA ESPECÍFICO PARA CONSUMIDOR01 COM CORREÇÃO
    const consumidor01Profile = profiles.find(p => p.email === 'consumidor01@email.com');
    if (consumidor01Profile) {
      console.log('🎯 [fetchUsers] === RASTREAMENTO CONSUMIDOR01 CORRIGIDO ===');
      console.log(`   Profile ID: ${consumidor01Profile.id}`);
      console.log(`   Nome: ${consumidor01Profile.nome}`);
      console.log(`   Email: ${consumidor01Profile.email}`);
      
      // Verificar TODOS os referrals que mencionam este usuário (incluindo pendentes)
      console.log('🔍 [fetchUsers] Verificando referrals onde CONSUMIDOR01 aparece (incluindo pendentes):');
      const consumidorReferrals = referrals?.filter(ref => 
        ref.referred_id === consumidor01Profile.id || ref.referrer_id === consumidor01Profile.id
      ) || [];
      
      if (consumidorReferrals.length > 0) {
        consumidorReferrals.forEach((ref, index) => {
          console.log(`   Referral ${index + 1}:`);
          console.log(`     ID: ${ref.id}`);
          console.log(`     Referrer: ${ref.referrer_id}`);
          console.log(`     Referred: ${ref.referred_id}`);
          console.log(`     Status: ${ref.status} ${ref.status === 'pendente' ? '🟡 PENDENTE ENCONTRADO!' : '🟢'}`);
          console.log(`     ${ref.referred_id === consumidor01Profile.id ? '👉 CONSUMIDOR01 é o REFERRED' : '👉 CONSUMIDOR01 é o REFERRER'}`);
        });
      } else {
        console.log(`   ❌ NENHUM referral encontrado para Consumidor01 (nem pendente nem aprovado)!`);
      }
      
      // Verificar se está no mapa de referrals CORRIGIDO
      const temReferral = referralsMap.has(consumidor01Profile.id);
      console.log(`   Tem referral no mapa CORRIGIDO: ${temReferral}`);
      
      if (temReferral) {
        const referrerId = referralsMap.get(consumidor01Profile.id);
        console.log(`   ✅ Referrer ID encontrado: ${referrerId}`);
        
        if (referrerId && profilesMap.has(referrerId)) {
          const referrerProfile = profilesMap.get(referrerId);
          console.log(`   ✅ Referrer encontrado:`);
          console.log(`     Nome: ${referrerProfile.nome}`);
          console.log(`     Email: ${referrerProfile.email}`);
          console.log(`     Código: ${referrerProfile.codigo}`);
        } else {
          console.log(`   ❌ Referrer não encontrado no mapa de profiles!`);
        }
      } else {
        console.log(`   ❌ Consumidor01 ainda não encontrado no mapa de referrals! Verificando query...`);
        
        // Debug adicional: verificar se existe referral direto com profissional2
        const profissional2Profile = profiles.find(p => p.email === 'profissional2@email.com');
        if (profissional2Profile) {
          console.log(`   🔍 Profissional2 existe: ID=${profissional2Profile.id}, Nome=${profissional2Profile.nome}`);
          
          // Verificar se existe referral direto entre eles (incluindo pendentes)
          const referralDireto = referrals?.find(ref => 
            ref.referred_id === consumidor01Profile.id && ref.referrer_id === profissional2Profile.id
          );
          
          if (referralDireto) {
            console.log(`   ✅ REFERRAL DIRETO ENCONTRADO (STATUS: ${referralDireto.status}):`);
            console.log(`     ID: ${referralDireto.id}`);
            console.log(`     Status: ${referralDireto.status}`);
            console.log(`     Data: ${referralDireto.data}`);
          } else {
            console.log(`   ❌ REFERRAL DIRETO AINDA NÃO ENCONTRADO! Problema na query ou dados.`);
          }
        }
      }
      
      console.log('🎯 [fetchUsers] === FIM RASTREAMENTO CONSUMIDOR01 CORRIGIDO ===');
    } else {
      console.log('❌ [fetchUsers] consumidor01@email.com NÃO ENCONTRADO nos profiles!');
    }

    // Agrupar compras por cliente
    const purchasesByClient: Record<string, number> = {};
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        if (order.cliente_id && order.valor_total) {
          const clienteId = order.cliente_id;
          if (!purchasesByClient[clienteId]) {
            purchasesByClient[clienteId] = 0;
          }
          purchasesByClient[clienteId] += Number(order.valor_total) || 0;
        }
      });
    }
    console.log(`📍 [fetchUsers] Compras processadas para ${Object.keys(purchasesByClient).length} clientes`);

    // 5. Processar cada usuário de forma segura (AGORA COM REFERRALS PENDENTES)
    console.log('🔄 [fetchUsers] Processando usuários (incluindo referrals pendentes)...');
    const enrichedUsers: UserData[] = [];

    for (let i = 0; i < profiles.length; i++) {
      const user = profiles[i];
      
      try {
        console.log(`\n👤 [fetchUsers] Processando usuário ${i + 1}/${profiles.length}: ${user.nome || 'Sem nome'} (${user.email})`);
        
        // Buscar quem indicou este usuário com informações completas (INCLUINDO PENDENTES)
        let indicadoPor = '';
        let indicadoPorCodigo = '';
        let referrerId = '';
        
        if (user.id && referralsMap.has(user.id)) {
          referrerId = referralsMap.get(user.id) || '';
          console.log(`   🔗 Referrer ID encontrado: ${referrerId}`);
          
          if (referrerId && profilesMap.has(referrerId)) {
            const referrerProfile = profilesMap.get(referrerId);
            const referrerNome = referrerProfile?.nome || '';
            const referrerCodigo = referrerProfile?.codigo || '';
            
            // Criar identificação única do indicador
            if (referrerNome) {
              if (referrerCodigo) {
                indicadoPor = `${referrerNome} (${referrerCodigo})`;
              } else {
                indicadoPor = `${referrerNome} (${referrerProfile?.email?.substring(0, 10) || 'ID:' + referrerId.substring(0, 8)})`;
              }
            }
            
            console.log(`   🔗 Indicado por: "${indicadoPor}"`);
          } else {
            console.log(`   ❌ Referrer profile não encontrado para ID: ${referrerId}`);
          }
        } else {
          console.log(`   ℹ️ Usuário não tem referral`);
        }
        
        // LOG ESPECÍFICO PARA CONSUMIDOR01 NO PROCESSAMENTO CORRIGIDO
        if (user.email === 'consumidor01@email.com') {
          console.log(`   🎯 PROCESSANDO CONSUMIDOR01 (CORRIGIDO):`);
          console.log(`      - User ID: ${user.id}`);
          console.log(`      - Referrals Map tem este ID: ${referralsMap.has(user.id)}`);
          console.log(`      - Referrer ID: ${referrerId}`);
          console.log(`      - Indicado por final: "${indicadoPor}"`);
          
          // Debug adicional para consumidor01
          if (!referralsMap.has(user.id)) {
            console.log(`      🔍 DEBUG: Verificando se referral existe mas não foi mapeado...`);
            const directReferral = referrals?.find(ref => ref.referred_id === user.id);
            if (directReferral) {
              console.log(`      ⚠️ ENCONTRADO referral direto que não foi mapeado!`);
              console.log(`         Status: ${directReferral.status}`);
              console.log(`         Referrer: ${directReferral.referrer_id}`);
            }
          }
        }
        
        // Calcular total de compras
        const totalCompras = user.id ? (purchasesByClient[user.id] || 0) : 0;
        console.log(`   💰 Total compras: R$ ${totalCompras.toFixed(2)}`);

        // Mapear campos de forma segura
        const codigoIndicacao = user.codigo || '';
        const especialidade = user.especialidade_profissional || '';
        
        console.log(`   📋 Código: "${codigoIndicacao}"`);
        console.log(`   🎯 Especialidade: "${especialidade}"`);

        // Formatar data de cadastro
        const dataCadastro = user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '';

        // Criar objeto do usuário de forma SEGURA
        const userData: UserData = {
          id: user.id || '',
          nome: user.nome || 'Sem nome',
          email: user.email || 'Sem email',
          papel: user.papel || user.tipo_perfil || 'consumidor',
          tipo_perfil: user.tipo_perfil || user.papel || 'consumidor',
          status: user.status || 'ativo',
          cpf: user.cpf || '',
          telefone: user.telefone || '',
          avatar: user.avatar || null,
          is_admin: Boolean(user.is_admin),
          saldo_pontos: Number(user.saldo_pontos) || 0,
          created_at: user.created_at || '',
          updated_at: user.updated_at || '',
          // CAMPOS ESSENCIAIS - GARANTIDOS (AGORA COM PENDENTES)
          codigo_indicacao: codigoIndicacao,
          indicado_por: indicadoPor,
          especialidade: especialidade,
          total_compras: totalCompras,
          data_cadastro: dataCadastro
        };

        // Log final do usuário processado se for consumidor01
        if (user.email === 'consumidor01@email.com') {
          console.log(`   🎯 CONSUMIDOR01 PROCESSADO FINAL (CORRIGIDO):`);
          console.log(`      - Código: "${userData.codigo_indicacao}"`);
          console.log(`      - Indicado por: "${userData.indicado_por}"`);
          console.log(`      - Especialidade: "${userData.especialidade}"`);
          console.log(`      - Total compras: R$ ${userData.total_compras.toFixed(2)}`);
          console.log(`      - Data cadastro: ${userData.data_cadastro}`);
        }

        enrichedUsers.push(userData);
        
      } catch (userError) {
        console.error(`❌ [fetchUsers] Erro ao processar usuário ${user.nome}:`, userError);
        // Adicionar usuário com dados mínimos em caso de erro
        enrichedUsers.push({
          id: user.id || '',
          nome: user.nome || 'Usuário com erro',
          email: user.email || '',
          papel: 'consumidor',
          tipo_perfil: 'consumidor',
          status: 'ativo',
          cpf: '',
          telefone: '',
          avatar: null,
          is_admin: false,
          saldo_pontos: 0,
          created_at: user.created_at || '',
          updated_at: user.updated_at || '',
          codigo_indicacao: '',
          indicado_por: '',
          especialidade: '',
          total_compras: 0,
          data_cadastro: user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : ''
        });
      }
    }
    
    console.log(`\n🎉 [fetchUsers] PROCESSAMENTO CONCLUÍDO (v8.0 COM PENDENTES):`);
    console.log(`   - Total de usuários processados: ${enrichedUsers.length}`);
    console.log(`   - Usuários com código de indicação: ${enrichedUsers.filter(u => u.codigo_indicacao).length}`);
    console.log(`   - Usuários indicados por alguém: ${enrichedUsers.filter(u => u.indicado_por).length}`);
    console.log(`   - Usuários com especialidade: ${enrichedUsers.filter(u => u.especialidade).length}`);
    console.log(`   - Usuários com compras: ${enrichedUsers.filter(u => u.total_compras > 0).length}`);
    
    // LOG FINAL ESPECÍFICO PARA CONSUMIDOR01 CORRIGIDO
    const consumidor01Final = enrichedUsers.find(u => u.email === 'consumidor01@email.com');
    if (consumidor01Final) {
      console.log(`\n🎯 [fetchUsers] RESULTADO FINAL CONSUMIDOR01 (CORRIGIDO):`);
      console.log(`   - Nome: ${consumidor01Final.nome}`);
      console.log(`   - Email: ${consumidor01Final.email}`);
      console.log(`   - Indicado por: "${consumidor01Final.indicado_por}"`);
      console.log(`   - Status: ${consumidor01Final.status}`);
      
      if (consumidor01Final.indicado_por) {
        console.log(`   ✅ SUCESSO: Referral encontrado e processado!`);
      } else {
        console.log(`   ❌ AINDA SEM REFERRAL: Verifique se o referral realmente existe na base.`);
      }
    }
    
    return enrichedUsers;
    
  } catch (error) {
    console.error('❌ [fetchUsers] ERRO CRÍTICO:', error);
    throw error;
  }
};
