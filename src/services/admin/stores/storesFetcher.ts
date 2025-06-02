
import { supabase } from '@/integrations/supabase/client';
import { AdminStore } from '@/types/admin';

export async function getAdminStores(): Promise<AdminStore[]> {
  try {
    console.log('[getAdminStores] Fetching admin stores...');
    
    // Buscar todas as lojas da tabela vendedores com informações do proprietário
    const { data: vendedoresData, error: vendedoresError } = await supabase
      .from('vendedores')
      .select(`
        id,
        nome_loja,
        descricao,
        logo,
        status,
        usuario_id,
        created_at,
        updated_at,
        telefone,
        email
      `)
      .order('created_at', { ascending: false });

    if (vendedoresError) {
      console.error('[getAdminStores] Error fetching vendedores:', vendedoresError);
      throw vendedoresError;
    }

    console.log('[getAdminStores] Vendedores fetched:', vendedoresData?.length || 0);

    // Buscar informações dos proprietários
    const proprietarioIds = vendedoresData?.map(v => v.usuario_id).filter(Boolean) || [];
    
    let proprietariosData: any[] = [];
    if (proprietarioIds.length > 0) {
      const { data, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone')
        .in('id', proprietarioIds);

      if (profilesError) {
        console.error('[getAdminStores] Error fetching profiles:', profilesError);
        // Não falhar por causa dos profiles, continuar sem os dados do proprietário
      } else {
        proprietariosData = data || [];
      }
    }

    // Buscar contagem de produtos para cada loja
    const lojaIds = vendedoresData?.map(v => v.id).filter(Boolean) || [];
    let produtosCounts: { [key: string]: number } = {};
    
    if (lojaIds.length > 0) {
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('vendedor_id')
        .in('vendedor_id', lojaIds);

      if (produtosError) {
        console.error('[getAdminStores] Error fetching products count:', produtosError);
      } else {
        // Contar produtos por vendedor
        produtosCounts = (produtosData || []).reduce((acc, produto) => {
          acc[produto.vendedor_id] = (acc[produto.vendedor_id] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
      }
    }

    // Mapear dados para o formato AdminStore
    const stores: AdminStore[] = (vendedoresData || []).map(vendedor => {
      const proprietario = proprietariosData.find(p => p.id === vendedor.usuario_id);
      
      return {
        id: vendedor.id,
        nome: vendedor.nome_loja,
        logo_url: vendedor.logo,
        banner_url: null, // Campo não existe na tabela vendedores
        descricao: vendedor.descricao,
        proprietario_id: vendedor.usuario_id,
        proprietario_nome: proprietario?.nome || 'Proprietário não encontrado',
        status: vendedor.status || 'pendente',
        produtos_count: produtosCounts[vendedor.id] || 0,
        contato: vendedor.telefone || vendedor.email || 'N/A',
        created_at: vendedor.created_at,
        updated_at: vendedor.updated_at
      };
    });

    // Verificar se existem lojistas sem entrada na tabela vendedores
    const { data: lojistasOrfaos, error: lojistasError } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, created_at')
      .eq('tipo_perfil', 'lojista')
      .not('id', 'in', `(${proprietarioIds.join(',') || 'null'})`);

    if (lojistasError) {
      console.error('[getAdminStores] Error checking orphan lojistas:', lojistasError);
    } else if (lojistasOrfaos && lojistasOrfaos.length > 0) {
      console.warn('[getAdminStores] Found lojistas without vendedores entry:', lojistasOrfaos.length);
      
      // Adicionar lojistas órfãos como lojas pendentes
      const lojasOrfas: AdminStore[] = lojistasOrfaos.map(lojista => ({
        id: `orphan-${lojista.id}`, // ID temporário para identificar
        nome: `${lojista.nome || 'Loja sem nome'} (Registro Incompleto)`,
        logo_url: null,
        banner_url: null,
        descricao: 'Lojista registrado mas sem dados de loja completos',
        proprietario_id: lojista.id,
        proprietario_nome: lojista.nome || 'Nome não informado',
        status: 'pendente',
        produtos_count: 0,
        contato: lojista.telefone || lojista.email || 'N/A',
        created_at: lojista.created_at,
        updated_at: lojista.created_at
      }));
      
      stores.push(...lojasOrfas);
    }

    console.log('[getAdminStores] Total stores processed:', stores.length);
    console.log('[getAdminStores] Stores by status:', {
      pendente: stores.filter(s => s.status === 'pendente').length,
      aprovado: stores.filter(s => s.status === 'aprovado').length,
      ativo: stores.filter(s => s.status === 'ativo').length,
      inativo: stores.filter(s => s.status === 'inativo').length
    });

    return stores;
  } catch (error) {
    console.error('[getAdminStores] Error:', error);
    throw error;
  }
}
