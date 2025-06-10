
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AdminProduct } from '@/types/admin';
import { parseImageData } from '@/utils/imageParser';

// ENHANCED: Helper function to extract and validate image URLs with proper parsing
const extractImageUrls = (imagensData: any): string[] => {
  if (!imagensData) return [];
  
  console.log('[extractImageUrls] Processing:', imagensData);
  
  // Use the enhanced parser to handle all formats including escaped JSON
  const parseResult = parseImageData(imagensData);
  
  console.log('[extractImageUrls] Parse result:', {
    urls: parseResult.urls,
    errors: parseResult.errors,
    originalFormat: parseResult.originalFormat
  });
  
  return parseResult.urls;
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
      // ENHANCED: Better image URL extraction with proper handling of escaped JSON
      const imagens = extractImageUrls(item.imagens);
      const imageUrl = imagens.length > 0 ? imagens[0] : null;
      
      // Enhanced logging for debugging
      console.log(`[getAdminProducts] Product ${item.id} images:`, { 
        originalData: item.imagens,
        originalType: typeof item.imagens,
        extractedUrls: imagens,
        firstUrl: imageUrl
      });
      
      // Use vendedor name from join with vendedores table
      const vendorInfo = item.vendedores as { nome_loja?: string } || {};
      const vendorName = vendorInfo.nome_loja || 'Loja desconhecida';
      
      console.log(`[getAdminProducts] Produto ${item.id} - vendedor_id: ${item.vendedor_id}, nome_loja: ${vendorName}`);
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        imagemUrl: imageUrl, // ENHANCED: Always set this for compatibility
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
        imagens: imagens, // ENHANCED: Always pass the properly parsed array of images
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
