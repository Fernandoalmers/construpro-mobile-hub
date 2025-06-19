
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
 * Get all approved products for marketplace with correct promotion handling
 */
export const getMarketplaceProducts = async (): Promise<MarketplaceProduct[]> => {
  try {
    console.log('[marketplaceProductsService] 🔍 Fetching approved products with improved promotion handling');
    
    // First, update expired promotions with corrected logic
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
    
    // Transform data with improved promotion handling
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // Debug vendor data processing with enhanced logging
      console.log('[marketplaceProductsService] Processing vendor data for product:', {
        productId: product.id,
        productName: product.nome,
        vendedor_id: product.vendedor_id,
        vendedores: product.vendedores,
        hasVendedorData: !!product.vendedores,
        promocao_ativa: product.promocao_ativa,
        promocao_fim: product.promocao_fim
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
      
      // FIXED: Improved promotion validation - check if promotion is actually expired
      let isPromotionActive = product.promocao_ativa || false;
      
      if (isPromotionActive && product.promocao_fim) {
        const now = new Date();
        const endDate = new Date(product.promocao_fim);
        
        // Add a small margin (1 minute) to avoid timezone/timing issues
        const isActuallyExpired = endDate.getTime() < (now.getTime() - 60000);
        
        if (isActuallyExpired) {
          console.log(`[marketplaceProductsService] 🕐 Promotion expired for product ${product.nome}: ${product.promocao_fim}`);
          isPromotionActive = false;
        } else {
          console.log(`[marketplaceProductsService] ✅ Promotion still active for product ${product.nome}: ends ${product.promocao_fim}`);
        }
      }
      
      const processedProduct = {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        promocao_ativa: isPromotionActive, // Use corrected promotion status
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
                  vendedores: p.vendedores,
                  promocao_ativa: p.promocao_ativa
                })));
    
    return products;
    
  } catch (error) {
    console.error('[marketplaceProductsService] 💥 Unexpected error:', error);
    toast.error('Erro inesperado ao carregar produtos');
    return [];
  }
};

/**
 * Update expired promotions in the database with improved logic
 */
const updateExpiredPromotions = async (): Promise<void> => {
  try {
    console.log('[marketplaceProductsService] 🔍 Checking for expired promotions...');
    
    // Get current time with a small margin to avoid timezone issues
    const now = new Date();
    const marginTime = new Date(now.getTime() - 60000); // 1 minute margin
    
    console.log('[marketplaceProductsService] Current time for expiration check:', now.toISOString());
    console.log('[marketplaceProductsService] Margin time for expiration check:', marginTime.toISOString());
    
    // First, get all products with active promotions to debug
    const { data: activePromotions, error: fetchError } = await supabase
      .from('produtos')
      .select('id, nome, promocao_ativa, promocao_fim')
      .eq('promocao_ativa', true)
      .not('promocao_fim', 'is', null);
    
    if (fetchError) {
      console.error('[marketplaceProductsService] Error fetching active promotions:', fetchError);
      return;
    }
    
    console.log(`[marketplaceProductsService] Found ${activePromotions?.length || 0} products with active promotions`);
    
    // Log each active promotion for debugging
    activePromotions?.forEach(promo => {
      const endDate = new Date(promo.promocao_fim);
      const isExpired = endDate < marginTime;
      console.log(`[marketplaceProductsService] Product "${promo.nome}": ends ${promo.promocao_fim}, expired: ${isExpired}`);
    });
    
    // Update only truly expired promotions with margin
    const { data: updatedProducts, error } = await supabase
      .from('produtos')
      .update({ promocao_ativa: false })
      .lt('promocao_fim', marginTime.toISOString())
      .eq('promocao_ativa', true)
      .select('id, nome, promocao_fim');
    
    if (error) {
      console.error('[marketplaceProductsService] Error updating expired promotions:', error);
    } else {
      console.log(`[marketplaceProductsService] ✅ Updated ${updatedProducts?.length || 0} expired promotions`);
      
      // Log which promotions were updated
      updatedProducts?.forEach(product => {
        console.log(`[marketplaceProductsService] Deactivated promotion for "${product.nome}" (ended: ${product.promocao_fim})`);
      });
    }
  } catch (error) {
    console.error('[marketplaceProductsService] Error calling update expired promotions:', error);
  }
};

/**
 * Get products by segment ID with improved promotion handling
 */
export const getProductsBySegment = async (segmentId: string): Promise<MarketplaceProduct[]> => {
  try {
    console.log(`[marketplaceProductsService] Fetching products for segment: ${segmentId}`);
    
    // Update expired promotions first
    await updateExpiredPromotions();
    
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
    
    // Apply the same data transformation as getMarketplaceProducts with improved promotion logic
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // Debug vendor data processing for segment products
      console.log('[marketplaceProductsService] Processing segment product vendor data:', {
        productId: product.id,
        vendedor_id: product.vendedor_id,
        vendedores: product.vendedores,
        promocao_ativa: product.promocao_ativa,
        promocao_fim: product.promocao_fim
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
      
      // Apply same promotion validation as main function
      let isPromotionActive = product.promocao_ativa || false;
      
      if (isPromotionActive && product.promocao_fim) {
        const now = new Date();
        const endDate = new Date(product.promocao_fim);
        const isActuallyExpired = endDate.getTime() < (now.getTime() - 60000);
        
        if (isActuallyExpired) {
          isPromotionActive = false;
        }
      }
      
      return {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        promocao_ativa: isPromotionActive, // Use corrected promotion status
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
