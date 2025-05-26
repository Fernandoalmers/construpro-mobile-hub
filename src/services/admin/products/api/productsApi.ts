
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AdminProduct } from '@/types/admin';

// Helper function to extract and validate image URLs
const extractImageUrls = (imagensData: any): string[] => {
  if (!imagensData) return [];
  
  // If it's a string, try to parse it as JSON
  if (typeof imagensData === 'string') {
    try {
      const parsed = JSON.parse(imagensData);
      if (Array.isArray(parsed)) {
        return parsed
          .map(img => {
            if (typeof img === 'string') return img;
            if (img && typeof img === 'object') return img.url || img.path || img.src || '';
            return '';
          })
          .filter(url => url && typeof url === 'string' && url.trim() !== '');
      }
      if (typeof parsed === 'string' && parsed.trim() !== '') {
        return [parsed];
      }
    } catch (e) {
      // If it's not valid JSON, treat it as a direct URL
      if (imagensData.trim() !== '') {
        return [imagensData];
      }
    }
  }
  
  // If it's already an array
  if (Array.isArray(imagensData)) {
    return imagensData
      .map(img => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object') return img.url || img.path || img.src || '';
        return '';
      })
      .filter(url => url && typeof url === 'string' && url.trim() !== '');
  }
  
  // If it's an object with url/path/src property
  if (imagensData && typeof imagensData === 'object') {
    const url = imagensData.url || imagensData.path || imagensData.src;
    if (url && typeof url === 'string' && url.trim() !== '') {
      return [url];
    }
  }
  
  return [];
};

/**
 * Fetch all products for admin management
 */
export const getAdminProducts = async (status?: string): Promise<AdminProduct[]> => {
  try {
    console.log('[getAdminProducts] executando query', status ? `com filtro status='${status}'` : 'sem filtro de status');
    
    // Build the base query
    let query = supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_normal,
        preco_promocional,
        pontos_consumidor,
        pontos_profissional,
        categoria,
        imagens,
        vendedor_id,
        estoque,
        status,
        created_at,
        updated_at,
        vendedores!inner(nome_loja)
      `)
      .order('created_at', { ascending: false });
      
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    console.log('[getAdminProducts] data:', data, 'error:', error);
      
    if (error) {
      console.error('[getAdminProducts] Error fetching produtos:', error);
      throw error;
    }

    console.log(`[getAdminProducts] Found ${data?.length || 0} products in 'produtos' table`);
    
    // Transform data to AdminProduct format
    const productsWithVendorInfo = (data || []).map(item => {
      // FIXED: Better image URL extraction with validation and blob URL detection
      const imagens = extractImageUrls(item.imagens);
      const imageUrl = imagens.length > 0 ? imagens[0] : null;
      
      // Log blob URL detection
      if (imageUrl && imageUrl.startsWith('blob:')) {
        console.warn(`[getAdminProducts] Blob URL detected for product ${item.id}: ${imageUrl.substring(0, 50)}...`);
      }
      
      console.log(`[getAdminProducts] Product ${item.id} final images:`, { 
        imageUrl, 
        imagens,
        originalImagens: item.imagens 
      });
      
      // Use vendedor name from join with vendedores table
      // Use a type assertion to tell TypeScript about the structure
      const vendorInfo = item.vendedores as { nome_loja?: string } || {};
      const vendorName = vendorInfo.nome_loja || 'Loja desconhecida';
      
      console.log(`[getAdminProducts] Produto ${item.id} - vendedor_id: ${item.vendedor_id}, nome_loja: ${vendorName}`);
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        imagemUrl: imageUrl, // FIXED: Always set this for compatibility
        preco: item.preco_normal,
        preco_normal: item.preco_normal,
        preco_promocional: item.preco_promocional,
        estoque: item.estoque,
        pontos: item.pontos_consumidor || 0,
        pontos_consumidor: item.pontos_consumidor || 0,
        pontos_profissional: item.pontos_profissional || 0,
        lojaId: item.vendedor_id,
        vendedor_id: item.vendedor_id,
        lojaNome: vendorName,
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at,
        updated_at: item.updated_at,
        imagens: imagens, // FIXED: Always pass the full array of images
        vendedores: item.vendedores
      };
    });
    
    return productsWithVendorInfo;
  } catch (error) {
    console.error('[getAdminProducts] Error in getAdminProducts:', error);
    toast({
      title: "Error",
      description: "Erro ao carregar produtos",
      variant: "destructive"
    });
    throw error;
  }
};

// Update the existing function for backwards compatibility
export const fetchAdminProducts = getAdminProducts;
