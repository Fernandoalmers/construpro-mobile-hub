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
 * Get all approved products for marketplace with optional delivery zone filtering
 */
export const getMarketplaceProducts = async (vendorIds?: string[]): Promise<MarketplaceProduct[]> => {
  try {
    console.log('[marketplaceProductsService] 🔍 Fetching approved products');
    
    if (vendorIds) {
      console.log('[marketplaceProductsService] 📍 Filtering by delivery zone vendors:', vendorIds.length);
    }
    
    // First, update expired promotions with corrected logic
    await updateExpiredPromotions();
    
    const { data: authData } = await supabase.auth.getUser();
    console.log('[marketplaceProductsService] 👤 Current user:', authData.user?.id || 'anonymous');
    
    // Base query
    let query = supabase
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
    
    // Apply vendor filter if provided
    if (vendorIds && vendorIds.length > 0) {
      query = query.in('vendedor_id', vendorIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[marketplaceProductsService] ❌ Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
      return [];
    }
    
    console.log(`[marketplaceProductsService] ✅ Successfully fetched ${data?.length || 0} approved products`);
    
    // Transform data with corrected promotion handling
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // Debug vendor data processing
      console.log('[marketplaceProductsService] Processing product:', {
        productId: product.id,
        productName: product.nome,
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
      
      // Process vendor/store information
      const vendedorData = product.vendedores;
      let storeInfo;
      
      if (vendedorData && typeof vendedorData === 'object') {
        storeInfo = {
          id: product.vendedor_id,
          nome: vendedorData.nome_loja || 'Loja sem nome',
          nome_loja: vendedorData.nome_loja || 'Loja sem nome',
          logo_url: vendedorData.logo || ''
        };
        
        console.log('[marketplaceProductsService] ✅ Processed store info:', {
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
      
      // Use the promotion status from database (already corrected by updateExpiredPromotions)
      const isPromotionActive = product.promocao_ativa || false;
      
      console.log(`[marketplaceProductsService] 📊 Product ${product.nome} promotion status: ${isPromotionActive}`);
      
      const processedProduct = {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        promocao_ativa: isPromotionActive,
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
        vendedores: vendedorData,
        created_at: product.created_at,
        updated_at: product.updated_at
      };

      return processedProduct;
    });
    
    console.log(`[marketplaceProductsService] 🔄 Processed ${products.length} products for marketplace display`);
    
    return products;
    
  } catch (error) {
    console.error('[marketplaceProductsService] 💥 Unexpected error:', error);
    toast.error('Erro inesperado ao carregar produtos');
    return [];
  }
};

/**
 * CORRECTED: Update expired promotions with proper time margin logic
 */
const updateExpiredPromotions = async (): Promise<void> => {
  try {
    console.log('[marketplaceProductsService] 🔍 Checking for expired promotions with corrected logic...');
    
    const now = new Date();
    console.log('[marketplaceProductsService] Current time:', now.toISOString());
    
    // First, get all products with active promotions for debugging
    const { data: activePromotions, error: fetchError } = await supabase
      .from('produtos')
      .select('id, nome, promocao_ativa, promocao_fim, promocao_inicio')
      .eq('promocao_ativa', true)
      .not('promocao_fim', 'is', null);
    
    if (fetchError) {
      console.error('[marketplaceProductsService] Error fetching active promotions:', fetchError);
      return;
    }
    
    console.log(`[marketplaceProductsService] Found ${activePromotions?.length || 0} products with active promotions`);
    
    // Analyze each promotion in detail
    const trulyExpiredPromotions: string[] = [];
    
    activePromotions?.forEach(promo => {
      const endDate = new Date(promo.promocao_fim);
      const startDate = promo.promocao_inicio ? new Date(promo.promocao_inicio) : null;
      
      // CORRECTED: Add margin AFTER the end time, not before
      const gracePeriod = 2 * 60 * 1000; // 2 minutes grace period
      const effectiveEndTime = endDate.getTime() + gracePeriod;
      const isActuallyExpired = now.getTime() > effectiveEndTime;
      
      console.log(`[marketplaceProductsService] 🔍 Analyzing "${promo.nome}":`, {
        promocao_inicio: promo.promocao_inicio,
        promocao_fim: promo.promocao_fim,
        endDateTime: endDate.toISOString(),
        currentTime: now.toISOString(),
        effectiveEndTime: new Date(effectiveEndTime).toISOString(),
        isActuallyExpired,
        minutesUntilExpiry: Math.round((effectiveEndTime - now.getTime()) / (60 * 1000))
      });
      
      if (isActuallyExpired) {
        trulyExpiredPromotions.push(promo.id);
        console.log(`[marketplaceProductsService] ❌ Will deactivate expired promotion for "${promo.nome}"`);
      } else {
        console.log(`[marketplaceProductsService] ✅ Keeping active promotion for "${promo.nome}"`);
      }
    });
    
    // Only update truly expired promotions
    if (trulyExpiredPromotions.length > 0) {
      console.log(`[marketplaceProductsService] 🔄 Deactivating ${trulyExpiredPromotions.length} truly expired promotions...`);
      
      const { data: updatedProducts, error } = await supabase
        .from('produtos')
        .update({ promocao_ativa: false })
        .in('id', trulyExpiredPromotions)
        .select('id, nome, promocao_fim');
      
      if (error) {
        console.error('[marketplaceProductsService] Error updating expired promotions:', error);
      } else {
        console.log(`[marketplaceProductsService] ✅ Successfully deactivated ${updatedProducts?.length || 0} expired promotions`);
        
        updatedProducts?.forEach(product => {
          console.log(`[marketplaceProductsService] 🔄 Deactivated promotion for "${product.nome}" (ended: ${product.promocao_fim})`);
        });
      }
    } else {
      console.log('[marketplaceProductsService] ✅ No expired promotions found - all active promotions are still valid');
    }
    
  } catch (error) {
    console.error('[marketplaceProductsService] Error in updateExpiredPromotions:', error);
  }
};

/**
 * Get products by segment ID with corrected promotion handling
 */
export const getProductsBySegment = async (segmentId: string, vendorIds?: string[]): Promise<MarketplaceProduct[]> => {
  try {
    console.log(`[marketplaceProductsService] Fetching products for segment: ${segmentId}`);
    
    // Update expired promotions first
    await updateExpiredPromotions();
    
    // Base query
    let query = supabase
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
    
    // Apply vendor filter if provided
    if (vendorIds && vendorIds.length > 0) {
      query = query.in('vendedor_id', vendorIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[marketplaceProductsService] Error fetching products by segment:', error);
      return [];
    }
    
    console.log(`[marketplaceProductsService] Found ${data?.length || 0} products for segment ${segmentId}`);
    
    // Apply the same data transformation as getMarketplaceProducts
    const products: MarketplaceProduct[] = (data || []).map(product => {
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
      
      // Process vendor/store information
      const storeInfo = product.vendedores ? {
        id: product.vendedor_id,
        nome: product.vendedores.nome_loja || 'Loja sem nome',
        nome_loja: product.vendedores.nome_loja || 'Loja sem nome',
        logo_url: product.vendedores.logo || ''
      } : undefined;
      
      // Use the corrected promotion status from database
      const isPromotionActive = product.promocao_ativa || false;
      
      return {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
        promocao_ativa: isPromotionActive,
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
