
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminProduct } from '@/types/admin';

/**
 * Fetch all products for admin management
 */
export const getAdminProducts = async (status?: string): Promise<AdminProduct[]> => {
  try {
    console.log('Fetching admin products from Supabase...');
    
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
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching produtos:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} products in 'produtos' table`);
    
    // Get vendor information for each product
    const productsWithVendorInfo = await Promise.all((data || []).map(async (item) => {
      // Get the first image URL from the images array if available
      let imageUrl = null;
      if (item.imagens && Array.isArray(item.imagens) && item.imagens.length > 0) {
        imageUrl = item.imagens[0];
      }
      
      let vendorName = 'Loja desconhecida';
      
      // Try to get vendor name
      if (item.vendedor_id) {
        try {
          // Try from lojas table
          const { data: lojaData } = await supabase
            .from('lojas')
            .select('nome')
            .eq('id', item.vendedor_id)
            .single();
              
          if (lojaData?.nome) {
            vendorName = lojaData.nome;
          }
        } catch (error) {
          console.log('Error fetching vendor name:', error);
        }
      }
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        imagemUrl: imageUrl,
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
        imagens: Array.isArray(item.imagens) ? item.imagens.filter(img => typeof img === 'string') : []
      };
    }));
    
    return productsWithVendorInfo;
  } catch (error) {
    console.error('Error in getAdminProducts:', error);
    toast.error('Erro ao carregar produtos');
    throw error;
  }
};

/**
 * Fetch pending products for admin approval
 */
export const getPendingProducts = async (): Promise<AdminProduct[]> => {
  try {
    return await getAdminProducts('pendente');
  } catch (error) {
    console.error('Error fetching pending products:', error);
    toast.error('Erro ao carregar produtos pendentes');
    throw error;
  }
};

// Re-export existing debug function
export { debugFetchProducts } from './adminProductApi';

// Update the existing function to use the new implementation
export const fetchPendingProducts = getPendingProducts;
export const fetchAdminProducts = getAdminProducts;
