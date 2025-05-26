
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
  imagemUrl?: string; // Adding this for compatibility
  imagem_url?: string; // Adding this for compatibility
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
    
    // Map segments by name for easier lookups
    const segmentsByName = new Map();
    segments.forEach(segment => {
      segmentsByName.set(segment.nome.toLowerCase(), segment.id);
      // Also add simple versions without accents
      const simplifiedName = segment.nome.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      segmentsByName.set(simplifiedName, segment.id);
    });
    
    // Common category to segment mappings
    const categoryToSegmentMap: Record<string, string> = {
      'ferramentas': 'Equipamentos',
      'tintas': 'Materiais de Construção',
      'hidráulica': 'Hidráulica',
      'hidraulica': 'Hidráulica',
      'elétrica': 'Elétrica',
      'eletrica': 'Elétrica',
      'iluminação': 'Elétrica',
      'iluminacao': 'Elétrica',
      'madeira': 'Materiais de Construção',
      'pisos': 'Materiais de Construção',
      'revestimento': 'Materiais de Construção',
      'mármore': 'Marmoraria',
      'marmore': 'Marmoraria',
      'granito': 'Marmoraria',
      'pedra': 'Marmoraria',
      'máquinas': 'Equipamentos',
      'maquinas': 'Equipamentos',
      'equipamento': 'Equipamentos'
    };
    
    // Transform to marketplace product format
    const products = (data || []).map(item => {
      // Parse and ensure imagens is an array of strings - FIXED APPROACH
      let imagens: string[] = [];
      
      console.log(`[getMarketplaceProducts] Processing images for product ${item.id}:`, item.imagens);
      
      if (item.imagens) {
        if (typeof item.imagens === 'string') {
          try {
            const parsedImages = JSON.parse(item.imagens);
            imagens = Array.isArray(parsedImages) 
              ? parsedImages.filter(img => typeof img === 'string' && img.trim() !== '')
              : [];
          } catch (e) {
            console.error(`[getMarketplaceProducts] Error parsing imagens for product ${item.id}:`, e);
            imagens = [];
          }
        } else if (Array.isArray(item.imagens)) {
          imagens = item.imagens
            .filter(img => img && typeof img === 'string' && img.trim() !== '')
            .map(img => String(img));
        }
      }
      
      // Find the primary image or first available - FIXED: Better logic
      const imagemPrincipal = imagens.length > 0 ? imagens[0] : null;
      
      console.log(`[getMarketplaceProducts] Product ${item.id} final images:`, { 
        imagens, 
        imagemPrincipal,
        originalImagens: item.imagens 
      });
      
      // Determine the segmento_id - enhanced approach
      let segmento_id = item.segmento_id;
      let segmento = item.segmento;
      
      // Try multiple approaches to determine segment_id if not already set
      if (!segmento_id) {
        // 1. Try to find by exact segment name match
        if (segmento && segmentsByName.has(segmento.toLowerCase())) {
          segmento_id = segmentsByName.get(segmento.toLowerCase());
          console.log(`[getMarketplaceProducts] Matched segment by name for product ${item.id}: ${segmento} -> ${segmento_id}`);
        } 
        // 2. Try to find by category mapping
        else if (item.categoria) {
          const lowerCategoria = item.categoria.toLowerCase();
          
          // Check each mapping for a match in the category
          for (const [categoryKey, segmentName] of Object.entries(categoryToSegmentMap)) {
            if (lowerCategoria.includes(categoryKey)) {
              const mappedSegmentId = segmentsByName.get(segmentName.toLowerCase());
              if (mappedSegmentId) {
                segmento_id = mappedSegmentId;
                segmento = segmentName; // Also update the segment name
                console.log(`[getMarketplaceProducts] Mapped category to segment for product ${item.id}: "${item.categoria}" -> "${segmentName}" (${mappedSegmentId})`);
                break;
              }
            }
          }
        }
      }
      
      // If still no segment_id, use default mapping based on keywords in name/description/category
      if (!segmento_id) {
        const lowerName = (item.nome || '').toLowerCase();
        const lowerDesc = (item.descricao || '').toLowerCase();
        const lowerCategoria = (item.categoria || '').toLowerCase();
        
        // Check for construction materials keywords
        if (
            lowerCategoria.includes('material') || 
            lowerCategoria.includes('construção') ||
            lowerCategoria.includes('construcao') ||
            lowerName.includes('tijolo') ||
            lowerName.includes('cimento') ||
            lowerName.includes('areia') ||
            lowerName.includes('argamassa')
        ) {
          const materiaisSegment = segments.find(s => 
            s.nome.toLowerCase().includes('materiais') && 
            s.nome.toLowerCase().includes('construção')
          );
          if (materiaisSegment) {
            segmento_id = materiaisSegment.id;
            segmento = materiaisSegment.nome;
            console.log(`[getMarketplaceProducts] Assigned Materiais de Construção segment to product ${item.id} based on keywords`);
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
        segmento: segmento,
        segmento_id: segmento_id,
        imagens,
        imagemPrincipal,
        imagemUrl: imagemPrincipal, // FIXED: Add compatibility property
        imagem_url: imagemPrincipal, // FIXED: Add compatibility property
        estoque: item.estoque,
        vendedor_id: item.vendedor_id,
        vendedor_nome: item.vendedores?.nome_loja || 'Loja não identificada',
        created_at: item.created_at
      };
    });
    
    console.log(`[getMarketplaceProducts] Processed ${products.length} products for marketplace`);
    
    // Log distribution of products by segment
    const segmentCounts: Record<string, number> = {};
    products.forEach(product => {
      if (product.segmento_id) {
        segmentCounts[product.segmento_id] = (segmentCounts[product.segmento_id] || 0) + 1;
      }
    });
    
    console.log('[getMarketplaceProducts] Products by segment:', Object.entries(segmentCounts).map(([segmentId, count]) => {
      const segmentName = segments.find(s => s.id === segmentId)?.nome || 'Unknown';
      return `${segmentName} (${segmentId}): ${count} products`;
    }));
    
    // Log products without segment
    const productsWithoutSegment = products.filter(p => !p.segmento_id);
    if (productsWithoutSegment.length > 0) {
      console.log(`[getMarketplaceProducts] WARNING: ${productsWithoutSegment.length} products don't have a segment assigned`);
      if (productsWithoutSegment.length <= 10) {
        console.log('Products without segment:', productsWithoutSegment.map(p => ({
          id: p.id,
          nome: p.nome,
          categoria: p.categoria
        })));
      }
    }
    
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
    
    // Parse and ensure imagens is an array of strings - FIXED APPROACH
    let imagens: string[] = [];
    
    console.log(`[getMarketplaceProductById] Processing images for product ${data.id}:`, data.imagens);
    
    if (data.imagens) {
      if (typeof data.imagens === 'string') {
        try {
          const parsedImages = JSON.parse(data.imagens);
          imagens = Array.isArray(parsedImages) 
            ? parsedImages.filter(img => typeof img === 'string' && img.trim() !== '')
            : [];
        } catch (e) {
          console.error(`[getMarketplaceProductById] Error parsing imagens:`, e);
          imagens = [];
        }
      } else if (Array.isArray(data.imagens)) {
        imagens = data.imagens
          .filter(img => img && typeof img === 'string' && img.trim() !== '')
          .map(img => String(img));
      }
    }
    
    // Find the primary image or first available
    const imagemPrincipal = imagens.length > 0 ? imagens[0] : null;
    
    console.log(`[getMarketplaceProductById] Product ${data.id} final images:`, { 
      imagens, 
      imagemPrincipal,
      originalImagens: data.imagens 
    });
    
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
      imagemUrl: imagemPrincipal, // FIXED: Add compatibility property
      imagem_url: imagemPrincipal, // FIXED: Add compatibility property
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
