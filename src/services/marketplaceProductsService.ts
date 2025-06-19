import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface MarketplaceProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_normal: number;
  preco_promocional?: number;
  promocao_ativa?: boolean;
  promocao_inicio?: string;
  promocao_fim?: string;
  estoque: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'rejeitado';
  pontos_consumidor: number;
  pontos_profissional: number;
  vendedor_id: string;
  segmento_id?: string;
  segmento?: string;
  stores?: {
    id: string;
    nome: string;
    nome_loja: string;
    logo_url?: string;
  };
  vendedores?: {
    id: string;
    nome_loja: string;
    logo?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all approved products for marketplace with active promotions only
 */
export const getMarketplaceProducts = async (): Promise<MarketplaceProduct[]> => {
  try {
    console.log('[marketplaceProductsService] 🔍 Fetching approved products with promotion filtering');
    
    // First, update expired promotions
    await updateExpiredPromotions();
    
    const { data: authData } = await supabase.auth.getUser();
    console.log('[marketplaceProductsService] 👤 Current user:', authData.user?.id || 'anonymous');
    
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (
          id,
          nome_loja,
          logo,
          telefone,
          email
        )
      `)
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[marketplaceProductsService] ❌ Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
      return [];
    }
    
    console.log(`[marketplaceProductsService] ✅ Successfully fetched ${data?.length || 0} approved products`);
    
    // Transform data and filter products with valid promotions
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // Debug vendor data processing with enhanced logging
      console.log('[marketplaceProductsService] Processing vendor data for product:', {
        productId: product.id,
        productName: product.nome,
        vendedor_id: product.vendedor_id,
        vendedores: product.vendedores,
        hasVendedorData: !!product.vendedores
      });

      // Process images properly
      let processedImages: string[] = [];
      if (product.imagens) {
        if (Array.isArray(product.imagens)) {
          processedImages = product.imagens.filter(img => typeof img === 'string');
        } else if (typeof product.imagens === 'string') {
          try {
            const parsed = JSON.parse(product.imagens);
            if (Array.isArray(parsed)) {
              processedImages = parsed.filter(img => typeof img === 'string');
            }
          } catch (e) {
            processedImages = [product.imagens];
          }
        }
      }
      
      // ENHANCED: Process vendor/store information with better error handling
      const vendedorData = product.vendedores;
      let storeInfo;
      
      if (vendedorData && typeof vendedorData === 'object') {
        storeInfo = {
          id: product.vendedor_id,
          nome: vendedorData.nome_loja || 'Loja sem nome',
          nome_loja: vendedorData.nome_loja || 'Loja sem nome',
          logo_url: vendedorData.logo || ''
        };
        
        console.log('[marketplaceProductsService] ✅ Successfully processed store info:', {
          productName: product.nome,
          storeName: storeInfo.nome_loja,
          storeId: storeInfo.id
        });
      } else {
        console.warn('[marketplaceProductsService] ⚠️ No vendor data found for product:', {
          productId: product.id,
          productName: product.nome,
          vendedor_id: product.vendedor_id
        });
      }
      
      const processedProduct = {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        promocao_ativa: product.promocao_ativa,
        promocao_inicio: product.promocao_inicio,
        promocao_fim: product.promocao_fim,
        estoque: product.estoque,
        imagens: processedImages,
        status: product.status as 'pendente' | 'aprovado' | 'rejeitado',
        pontos_consumidor: product.pontos_consumidor || 0,
        pontos_profissional: product.pontos_profissional || 0,
        vendedor_id: product.vendedor_id,
        segmento_id: product.segmento_id,
        segmento: product.segmento,
        stores: storeInfo,
        vendedores: vendedorData, // Keep original vendor data
        created_at: product.created_at,
        updated_at: product.updated_at
      };

      return processedProduct;
    });
    
    console.log(`[marketplaceProductsService] 🔄 Processed ${products.length} products for marketplace display`);
    console.log('[marketplaceProductsService] Final processed products with vendor info:', 
                products.slice(0, 2).map(p => ({
                  id: p.id,
                  nome: p.nome,
                  stores: p.stores,
                  vendedores: p.vendedores
                })));
    
    return products;
    
  } catch (error) {
    console.error('[marketplaceProductsService] 💥 Unexpected error:', error);
    toast.error('Erro inesperado ao carregar produtos');
    return [];
  }
};

/**
 * Update expired promotions in the database
 */
const updateExpiredPromotions = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('update_expired_promotions');
    
    if (error) {
      console.error('[marketplaceProductsService] Error updating expired promotions:', error);
    } else {
      console.log('[marketplaceProductsService] ✅ Updated expired promotions');
    }
  } catch (error) {
    console.error('[marketplaceProductsService] Error calling update_expired_promotions:', error);
  }
};

/**
 * Get products by segment ID
 */
export const getProductsBySegment = async (segmentId: string): Promise<MarketplaceProduct[]> => {
  try {
    console.log(`[marketplaceProductsService] Fetching products for segment: ${segmentId}`);
    
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (
          id,
          nome_loja,
          logo
        )
      `)
      .eq('status', 'aprovado')
      .eq('segmento_id', segmentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[marketplaceProductsService] Error fetching products by segment:', error);
      return [];
    }
    
    console.log(`[marketplaceProductsService] Found ${data?.length || 0} products for segment ${segmentId}`);
    
    // Apply the same data transformation as getMarketplaceProducts
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // Debug vendor data processing for segment products
      console.log('[marketplaceProductsService] Processing segment product vendor data:', {
        productId: product.id,
        vendedor_id: product.vendedor_id,
        vendedores: product.vendedores
      });

      // Process images properly
      let processedImages: string[] = [];
      if (product.imagens) {
        if (Array.isArray(product.imagens)) {
          processedImages = product.imagens.filter(img => typeof img === 'string');
        } else if (typeof product.imagens === 'string') {
          try {
            const parsed = JSON.parse(product.imagens);
            if (Array.isArray(parsed)) {
              processedImages = parsed.filter(img => typeof img === 'string');
            }
          } catch (e) {
            processedImages = [product.imagens];
          }
        }
      }
      
      // Process vendor/store information with better handling
      const storeInfo = product.vendedores ? {
        id: product.vendedor_id,
        nome: product.vendedores.nome_loja || 'Loja sem nome',
        nome_loja: product.vendedores.nome_loja || 'Loja sem nome',
        logo_url: product.vendedores.logo || ''
      } : undefined;
      
      return {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        promocao_ativa: product.promocao_ativa,
        promocao_inicio: product.promocao_inicio,
        promocao_fim: product.promocao_fim,
        estoque: product.estoque,
        imagens: processedImages,
        status: product.status as 'pendente' | 'aprovado' | 'rejeitado',
        pontos_consumidor: product.pontos_consumidor || 0,
        pontos_profissional: product.pontos_profissional || 0,
        vendedor_id: product.vendedor_id,
        segmento_id: product.segmento_id,
        segmento: product.segmento,
        stores: storeInfo,
        created_at: product.created_at,
        updated_at: product.updated_at
      };
    });
    
    return products;
    
  } catch (error) {
    console.error('[marketplaceProductsService] Error in getProductsBySegment:', error);
    return [];
  }
};
