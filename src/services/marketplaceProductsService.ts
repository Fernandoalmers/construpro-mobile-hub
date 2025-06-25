
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceProduct {
  id: string;
  nome: string;
  descricao?: string;
  preco_original: number;
  preco_promocional?: number;
  promocao_ativa: boolean;
  promocao_inicio?: string;
  promocao_fim?: string;
  imagens?: string[];
  categoria?: string;
  segmento?: string;
  segmento_id?: string;
  estoque: number;
  vendedor_id: string;
  store_name?: string;
  store_id?: string;
  stores?: any;
  vendedores?: any;
  pontos_consumidor?: number;
  pontos_profissional?: number;
  unidade?: string;
  embalagem?: string;
  peso?: number;
  dimensoes?: string;
  marca?: string;
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  created_at?: string;
  updated_at?: string;
  // Legacy fields for compatibility
  preco_normal?: number;
}

export const getMarketplaceProducts = async (vendorIds?: string[]): Promise<MarketplaceProduct[]> => {
  console.log('[marketplaceProductsService] 🔍 Buscando produtos do marketplace...');
  console.log('[marketplaceProductsService] 📊 Filtros:', {
    vendorIds: vendorIds?.length ? `${vendorIds.length} vendedores` : 'todos os vendedores',
    timestamp: new Date().toISOString()
  });

  try {
    let query = supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_original,
        preco_promocional,
        promocao_ativa,
        promocao_inicio,
        promocao_fim,
        imagens,
        categoria,
        segmento,
        segmento_id,
        estoque,
        vendedor_id,
        pontos_consumidor,
        pontos_profissional,
        unidade,
        embalagem,
        peso,
        dimensoes,
        marca,
        status,
        created_at,
        updated_at,
        vendedores!inner (
          id,
          nome_loja,
          status
        )
      `)
      .eq('status', 'aprovado')
      .eq('vendedores.status', 'ativo')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });

    // Aplicar filtro por vendedores se fornecido
    if (vendorIds && vendorIds.length > 0) {
      query = query.in('vendedor_id', vendorIds);
      console.log('[marketplaceProductsService] 🎯 Aplicando filtro por vendedores:', vendorIds.length);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('[marketplaceProductsService] ❌ Erro ao buscar produtos:', error);
      throw error;
    }

    if (!products || products.length === 0) {
      console.log('[marketplaceProductsService] ℹ️ Nenhum produto encontrado');
      return [];
    }

    // OTIMIZADO: Processar produtos em lote em vez de um por um
    console.log('[marketplaceProductsService] ⚙️ Processando', products.length, 'produtos em lote...');
    
    const processedProducts = products.map((product: any) => {
      // Processar informações da loja
      const storeInfo = product.vendedores;
      const storeName = storeInfo?.nome_loja || 'Loja não identificada';
      const storeId = storeInfo?.id || product.vendedor_id;

      // Processar imagens
      let processedImages: string[] = [];
      if (product.imagens) {
        try {
          processedImages = Array.isArray(product.imagens) 
            ? product.imagens 
            : JSON.parse(product.imagens);
        } catch (error) {
          processedImages = [];
        }
      }

      return {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        preco_original: product.preco_original,
        preco_promocional: product.preco_promocional,
        promocao_ativa: product.promocao_ativa || false,
        promocao_inicio: product.promocao_inicio,
        promocao_fim: product.promocao_fim,
        imagens: processedImages,
        categoria: product.categoria,
        segmento: product.segmento,
        segmento_id: product.segmento_id,
        estoque: product.estoque,
        vendedor_id: product.vendedor_id,
        store_name: storeName,
        store_id: storeId,
        stores: storeInfo ? {
          id: storeId,
          nome: storeName,
          nome_loja: storeName,
          logo_url: storeInfo.logo || ''
        } : undefined,
        vendedores: storeInfo,
        pontos_consumidor: product.pontos_consumidor,
        pontos_profissional: product.pontos_profissional,
        unidade: product.unidade,
        embalagem: product.embalagem,
        peso: product.peso,
        dimensoes: product.dimensoes,
        marca: product.marca,
        status: product.status as 'pendente' | 'aprovado' | 'rejeitado',
        created_at: product.created_at,
        updated_at: product.updated_at,
        // Legacy compatibility
        preco_normal: product.preco_original
      };
    });

    // Log consolidado do resultado
    const storeCount = new Set(processedProducts.map(p => p.store_id)).size;
    const promotionCount = processedProducts.filter(p => p.promocao_ativa).length;
    
    console.log('[marketplaceProductsService] ✅ Processamento concluído:', {
      produtos: processedProducts.length,
      lojas: storeCount,
      promocoes: promotionCount,
      tempoProcessamento: 'otimizado em lote'
    });

    return processedProducts;

  } catch (error) {
    console.error('[marketplaceProductsService] ❌ Erro geral:', error);
    throw error;
  }
};
