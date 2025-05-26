
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

// Helper function to extract and validate image URLs
const extractImageUrls = (imagensData: any): string[] => {
  const urls: string[] = [];
  
  console.log('[extractImageUrls] Processing:', imagensData, 'Type:', typeof imagensData);
  
  if (!imagensData) {
    console.log('[extractImageUrls] No image data provided');
    return urls;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof imagensData === 'string') {
    console.log('[extractImageUrls] Processing string data:', imagensData.substring(0, 100));
    try {
      const parsed = JSON.parse(imagensData);
      if (Array.isArray(parsed)) {
        console.log('[extractImageUrls] Parsed as array:', parsed);
        return parsed
          .map(img => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') return img.url || img.path || img.src || '';
            return '';
          })
          .filter(url => url && typeof url === 'string' && url.trim() !== '');
      }
      // If parsed is not an array but a valid URL string
      if (typeof parsed === 'string' && parsed.trim() !== '') {
        console.log('[extractImageUrls] Parsed as single URL:', parsed);
        return [parsed];
      }
    } catch (e) {
      console.log('[extractImageUrls] JSON parse failed, treating as direct URL');
      // If it's not valid JSON, treat it as a direct URL
      if (imagensData.trim() !== '') {
        return [imagensData];
      }
    }
  }
  
  // If it's already an array
  if (Array.isArray(imagensData)) {
    console.log('[extractImageUrls] Processing array:', imagensData);
    imagensData.forEach((img, index) => {
      console.log(`[extractImageUrls] Array item ${index}:`, img, 'Type:', typeof img);
      if (typeof img === 'string' && img.trim() !== '') {
        urls.push(img);
      } else if (img && typeof img === 'object') {
        const url = img.url || img.path || img.src;
        if (url && typeof url === 'string' && url.trim() !== '') {
          urls.push(url);
        }
      }
    });
    console.log('[extractImageUrls] Extracted from array:', urls);
    return urls;
  }
  
  // If it's an object with url/path/src property
  if (imagensData && typeof imagensData === 'object') {
    console.log('[extractImageUrls] Processing object:', imagensData);
    const url = imagensData.url || imagensData.path || imagensData.src;
    if (url && typeof url === 'string' && url.trim() !== '') {
      console.log('[extractImageUrls] Extracted from object:', url);
      return [url];
    }
  }
  
  console.log('[extractImageUrls] No valid URLs found, returning empty array');
  return urls;
};

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
      console.log(`[getMarketplaceProducts] Processing product ${item.id} - ${item.nome}`);
      console.log(`[getMarketplaceProducts] Raw imagens for ${item.nome}:`, item.imagens);
      
      // Extract images with detailed logging
      const imagens = extractImageUrls(item.imagens);
      const imagemPrincipal = imagens.length > 0 ? imagens[0] : null;
      
      // Log blob URL detection
      if (imagemPrincipal && imagemPrincipal.startsWith('blob:')) {
        console.warn(`[getMarketplaceProducts] ⚠️  BLOB URL detected for product ${item.nome}: ${imagemPrincipal.substring(0, 50)}...`);
        console.warn(`[getMarketplaceProducts] This image will not work after browser refresh!`);
      } else if (imagemPrincipal) {
        console.log(`[getMarketplaceProducts] ✅ Valid image URL for ${item.nome}: ${imagemPrincipal.substring(0, 50)}...`);
      } else {
        console.warn(`[getMarketplaceProducts] ❌ No image found for product ${item.nome}`);
        console.log(`[getMarketplaceProducts] Original imagens data:`, item.imagens);
      }
      
      console.log(`[getMarketplaceProducts] Final images for ${item.nome}:`, { 
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
            lowerName.includes('argamassa') ||
            lowerName.includes('malha') // Add malha keyword
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
        imagemUrl: imagemPrincipal, // Always set this for compatibility
        imagem_url: imagemPrincipal, // Always set this for compatibility
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
    
    // Log products without images
    const productsWithoutImages = products.filter(p => !p.imagemUrl);
    if (productsWithoutImages.length > 0) {
      console.warn(`[getMarketplaceProducts] ⚠️  ${productsWithoutImages.length} products don't have images:`);
      productsWithoutImages.forEach(p => {
        console.warn(`- ${p.nome} (ID: ${p.id})`);
      });
    }
    
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
    
    // FIXED: Better image extraction with validation and blob URL detection
    const imagens = extractImageUrls(data.imagens);
    const imagemPrincipal = imagens.length > 0 ? imagens[0] : null;
    
    // Log blob URL detection
    if (imagemPrincipal && imagemPrincipal.startsWith('blob:')) {
      console.warn(`[getMarketplaceProductById] Blob URL detected for product ${data.id}: ${imagemPrincipal.substring(0, 50)}...`);
    }
    
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
      imagemUrl: imagemPrincipal, // FIXED: Always set this for compatibility
      imagem_url: imagemPrincipal, // FIXED: Always set this for compatibility
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
