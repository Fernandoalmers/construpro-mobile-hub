
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getProductSegments } from '@/services/admin/productSegmentsService';

export interface MarketplaceProduct {
  id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number;
  pontos_consumidor: number;
  categoria: string;
  imagens: string[];
  imagemPrincipal?: string;
  estoque: number;
  vendedor_id: string;
  vendedor_nome: string;
  created_at?: string;
  segmento?: string;
  segmento_id?: string;
}

/**
 * Get approved products for marketplace display
 */
export const getMarketplaceProducts = async (categoria?: string): Promise<MarketplaceProduct[]> => {
  try {
    // Get product segments for reference
    const segments = await getProductSegments();
    console.log('[getMarketplaceProducts] Available segments:', segments.map(s => ({ id: s.id, nome: s.nome })));
    
    // Build base query
    let query = supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('status', 'aprovado')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });
      
    // Filter by category if provided
    if (categoria) {
      console.log('[getMarketplaceProducts] Filtering by categoria:', categoria);
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching marketplace products:', error);
      throw error;
    }
    
    console.log(`[getMarketplaceProducts] Retrieved ${data?.length || 0} products from database`);
    
    // Transform to marketplace product format
    const products = (data || []).map(item => {
      // Parse and ensure imagens is an array of strings
      let imagens: string[] = [];
      
      if (item.imagens) {
        if (typeof item.imagens === 'string') {
          try {
            const parsedImages = JSON.parse(item.imagens);
            imagens = Array.isArray(parsedImages) 
              ? parsedImages.map(img => String(img))
              : [];
          } catch (e) {
            console.error(`[getMarketplaceProducts] Error parsing imagens for product ${item.id}:`, e);
            imagens = [];
          }
        } else if (Array.isArray(item.imagens)) {
          imagens = item.imagens.map(img => String(img));
        }
      }
      
      // Find the primary image or first available
      const imagemPrincipal = imagens.length > 0 ? imagens[0] : null;
      
      // If segmento_id is null but segmento name exists, try to find matching segment ID
      let segmento_id = item.segmento_id;
      if (!segmento_id && item.segmento) {
        const matchingSegment = segments.find(
          s => s.nome.toLowerCase() === item.segmento?.toLowerCase()
        );
        if (matchingSegment) {
          segmento_id = matchingSegment.id;
          console.log(`[getMarketplaceProducts] Matched segment for product ${item.id}: ${item.segmento} -> ${segmento_id}`);
        }
      }
      
      // Special handling for "Materiais de Construção" segment
      if (!segmento_id && item.categoria) {
        const lowerCategoria = item.categoria.toLowerCase();
        if (lowerCategoria.includes("material") || lowerCategoria.includes("construção")) {
          // Find the "Materiais de Construção" segment
          const materiaisSegment = segments.find(
            s => s.nome.toLowerCase() === "materiais de construção"
          );
          
          if (materiaisSegment) {
            segmento_id = materiaisSegment.id;
            console.log(`[getMarketplaceProducts] Assigned Materiais de Construção segment to product ${item.id} based on categoria: ${item.categoria}`);
          }
        }
      }
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        preco_normal: item.preco_normal,
        preco_promocional: item.preco_promocional,
        pontos_consumidor: item.pontos_consumidor || 0,
        categoria: item.categoria,
        segmento: item.segmento,
        segmento_id: segmento_id,
        imagens,
        imagemPrincipal,
        estoque: item.estoque,
        vendedor_id: item.vendedor_id,
        vendedor_nome: item.vendedores?.nome_loja || 'Loja não identificada',
        created_at: item.created_at
      };
    });
    
    console.log(`[getMarketplaceProducts] Processed ${products.length} products for marketplace`);
    return products;
    
  } catch (error) {
    console.error('Error in getMarketplaceProducts:', error);
    toast.error('Erro ao carregar produtos');
    return [];
  }
};

/**
 * Get a single product for marketplace display
 */
export const getMarketplaceProductById = async (id: string): Promise<MarketplaceProduct | null> => {
  try {
    // Get product segments for reference
    const segments = await getProductSegments();
    
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('id', id)
      .eq('status', 'aprovado')
      .single();
    
    if (error) {
      console.error('Error fetching product details:', error);
      throw error;
    }
    
    if (!data) return null;
    
    // Parse and ensure imagens is an array of strings
    let imagens: string[] = [];
    
    if (data.imagens) {
      if (typeof data.imagens === 'string') {
        try {
          const parsedImages = JSON.parse(data.imagens);
          imagens = Array.isArray(parsedImages) 
            ? parsedImages.map(img => String(img))
            : [];
        } catch (e) {
          console.error(`[getMarketplaceProductById] Error parsing imagens:`, e);
          imagens = [];
        }
      } else if (Array.isArray(data.imagens)) {
        imagens = data.imagens.map(img => String(img));
      }
    }
    
    // Find the primary image or first available
    const imagemPrincipal = imagens.length > 0 ? imagens[0] : null;
    
    // If segmento_id is null but segmento name exists, try to find matching segment ID
    let segmento_id = data.segmento_id;
    if (!segmento_id && data.segmento) {
      const matchingSegment = segments.find(
        s => s.nome.toLowerCase() === data.segmento?.toLowerCase()
      );
      if (matchingSegment) {
        segmento_id = matchingSegment.id;
      }
    }
    
    // Special handling for "Materiais de Construção" segment
    if (!segmento_id && data.categoria) {
      const lowerCategoria = data.categoria.toLowerCase();
      if (lowerCategoria.includes("material") || lowerCategoria.includes("construção")) {
        // Find the "Materiais de Construção" segment
        const materiaisSegment = segments.find(
          s => s.nome.toLowerCase() === "materiais de construção"
        );
        
        if (materiaisSegment) {
          segmento_id = materiaisSegment.id;
        }
      }
    }
    
    return {
      id: data.id,
      nome: data.nome,
      descricao: data.descricao,
      preco_normal: data.preco_normal,
      preco_promocional: data.preco_promocional,
      pontos_consumidor: data.pontos_consumidor || 0,
      categoria: data.categoria,
      segmento: data.segmento,
      segmento_id: segmento_id,
      imagens,
      imagemPrincipal,
      estoque: data.estoque,
      vendedor_id: data.vendedor_id,
      vendedor_nome: data.vendedores?.nome_loja || 'Loja não identificada',
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error in getMarketplaceProductById:', error);
    return null;
  }
};
