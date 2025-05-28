
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface MarketplaceProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_normal: number;
  preco_promocional?: number;
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
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all approved products for marketplace - accessible to ALL users
 * This service ensures products are visible to all authenticated users
 */
export const getMarketplaceProducts = async (): Promise<MarketplaceProduct[]> => {
  try {
    console.log('[marketplaceProductsService] 🔍 Fetching ALL approved products for marketplace');
    
    // Check user authentication status for debugging
    const { data: authData } = await supabase.auth.getUser();
    console.log('[marketplaceProductsService] 👤 Current user:', authData.user?.id || 'anonymous');
    
    // Enhanced query to get products with store information
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
      .eq('status', 'aprovado') // Only approved products
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[marketplaceProductsService] ❌ Error fetching products:', error);
      console.error('[marketplaceProductsService] 📊 Error details:', error.details);
      console.error('[marketplaceProductsService] 💡 Error hint:', error.hint);
      toast.error('Erro ao carregar produtos');
      return [];
    }
    
    console.log(`[marketplaceProductsService] ✅ Successfully fetched ${data?.length || 0} approved products`);
    
    if (data && data.length > 0) {
      console.log('[marketplaceProductsService] 📋 Sample products with vendor data:', data.slice(0, 2).map(p => ({
        id: p.id,
        nome: p.nome,
        status: p.status,
        vendedor_id: p.vendedor_id,
        vendedores: p.vendedores,
        segmento_id: p.segmento_id
      })));
    } else {
      console.warn('[marketplaceProductsService] ⚠️ No products found! Possible causes:');
      console.warn('1. No approved products in database');
      console.warn('2. RLS policy blocking access');
      console.warn('3. Database connection issue');
    }
    
    // Transform data to match interface
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // Debug vendor data processing
      console.log('[marketplaceProductsService] Processing vendor data for product:', {
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

      console.log('[marketplaceProductsService] Processed store info:', storeInfo);
      
      return {
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal,
        preco_promocional: product.preco_promocional,
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
    
    console.log(`[marketplaceProductsService] 🔄 Processed ${products.length} products for marketplace display`);
    console.log('[marketplaceProductsService] Sample processed products:', products.slice(0, 2).map(p => ({
      id: p.id,
      nome: p.nome,
      stores: p.stores
    })));
    
    return products;
    
  } catch (error) {
    console.error('[marketplaceProductsService] 💥 Unexpected error:', error);
    toast.error('Erro inesperado ao carregar produtos');
    return [];
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
