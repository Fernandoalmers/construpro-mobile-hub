
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
  vendedores?: {
    id: string;
    nome_loja: string;
    logo?: string;
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
    
    // ENHANCED: Query with ALWAYS INCLUDED vendor information - NO conditional logic
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id!inner (
          id,
          nome_loja,
          logo,
          telefone,
          email
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
      console.log('[marketplaceProductsService] 📋 Raw data sample with vendor info:', 
                  data.slice(0, 2).map(p => ({
                    id: p.id,
                    nome: p.nome,
                    vendedor_id: p.vendedor_id,
                    vendedores: p.vendedores
                  })));
    } else {
      console.warn('[marketplaceProductsService] ⚠️ No products found! Possible causes:');
      console.warn('1. No approved products in database');
      console.warn('2. RLS policy blocking access');
      console.warn('3. Database connection issue');
    }
    
    // Transform data to match interface - MANDATORY VENDOR INFO
    const products: MarketplaceProduct[] = (data || []).map(product => {
      // FIXED: Mandatory vendor processing - no fallbacks
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
      
      // MANDATORY: Process vendor/store information - ALWAYS REQUIRED
      const vendedorData = product.vendedores;
      
      // Since we use !inner join, vendedorData should ALWAYS exist
      if (!vendedorData || !vendedorData.nome_loja) {
        console.error('[marketplaceProductsService] ❌ CRITICAL: Product without vendor data found:', {
          productId: product.id,
          productName: product.nome,
          vendedor_id: product.vendedor_id
        });
        // Skip products without vendor data instead of showing them without store info
        return null;
      }
      
      const storeInfo = {
        id: product.vendedor_id,
        nome: vendedorData.nome_loja,
        nome_loja: vendedorData.nome_loja,
        logo_url: vendedorData.logo || ''
      };
      
      console.log('[marketplaceProductsService] ✅ Successfully processed store info:', {
        productName: product.nome,
        storeName: storeInfo.nome_loja,
        storeId: storeInfo.id
      });
      
      const processedProduct = {
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
        vendedores: vendedorData, // Keep original vendor data
        created_at: product.created_at,
        updated_at: product.updated_at
      };

      return processedProduct;
    }).filter(product => product !== null); // Remove any null products
    
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
 * Get products by segment ID
 */
export const getProductsBySegment = async (segmentId: string): Promise<MarketplaceProduct[]> => {
  try {
    console.log(`[marketplaceProductsService] Fetching products for segment: ${segmentId}`);
    
    // ENHANCED: Always include vendor information with !inner join
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id!inner (
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
      
      // MANDATORY: Process vendor/store information - no fallbacks
      const vendedorData = product.vendedores;
      
      if (!vendedorData || !vendedorData.nome_loja) {
        console.error('[marketplaceProductsService] ❌ CRITICAL: Segment product without vendor data found:', {
          productId: product.id,
          segmentId: segmentId
        });
        return null;
      }
      
      const storeInfo = {
        id: product.vendedor_id,
        nome: vendedorData.nome_loja,
        nome_loja: vendedorData.nome_loja,
        logo_url: vendedorData.logo || ''
      };
      
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
    }).filter(product => product !== null);
    
    return products;
    
  } catch (error) {
    console.error('[marketplaceProductsService] Error in getProductsBySegment:', error);
    return [];
  }
};
