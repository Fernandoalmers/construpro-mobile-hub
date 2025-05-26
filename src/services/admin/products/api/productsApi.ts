
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AdminProduct } from '@/types/admin';

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
      // FIXED: Better image URL extraction with validation
      let imageUrl = null;
      let imagens: string[] = [];
      
      console.log(`[getAdminProducts] Processing images for product ${item.id}:`, item.imagens);
      
      if (item.imagens) {
        if (typeof item.imagens === 'string') {
          try {
            const parsedImages = JSON.parse(item.imagens);
            if (Array.isArray(parsedImages)) {
              imagens = parsedImages
                .filter(img => img && typeof img === 'string' && img.trim() !== '')
                .map(img => String(img));
              imageUrl = imagens.length > 0 ? imagens[0] : null;
            }
          } catch (e) {
            console.error(`[getAdminProducts] Error parsing imagens for product ${item.id}:`, e);
            imagens = [];
            imageUrl = null;
          }
        } else if (Array.isArray(item.imagens)) {
          imagens = item.imagens
            .filter(img => img && typeof img === 'string' && img.trim() !== '')
            .map(img => String(img));
          imageUrl = imagens.length > 0 ? imagens[0] : null;
        }
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
        imagemUrl: imageUrl, // FIXED: Use extracted image URL
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
        imagens: imagens, // FIXED: Pass the filtered array of images
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
