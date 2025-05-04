
import { supabase } from '@/integrations/supabase/client';
import { AdminProduct } from '@/types/admin';

/**
 * Get products waiting for approval
 * @returns Promise with an array of products with pending status
 */
export const getPendingProducts = async (): Promise<AdminProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_normal,
        pontos_consumidor,
        categoria,
        imagens,
        vendedor_id,
        estoque,
        status,
        created_at,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    // Transform the data to match the AdminProduct interface
    const products: AdminProduct[] = data.map(item => {
      // Get the first image URL from the images array if available
      let imageUrl = null;
      if (item.imagens && Array.isArray(item.imagens) && item.imagens.length > 0) {
        imageUrl = item.imagens[0];
      }
      
      return {
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        imagemUrl: imageUrl,
        preco: item.preco_normal,
        preco_normal: item.preco_normal,
        estoque: item.estoque,
        pontos: item.pontos_consumidor || 0,
        pontos_consumidor: item.pontos_consumidor || 0,
        pontos_profissional: 0,
        lojaId: item.vendedor_id,
        vendedor_id: item.vendedor_id,
        lojaNome: item.vendedores?.nome_loja || 'Loja desconhecida',
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at,
        imagens: Array.isArray(item.imagens) ? item.imagens.filter(img => typeof img === 'string') : [],
        vendedores: item.vendedores
      };
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching pending products:', error);
    return [];
  }
};

/**
 * Mark a product as pending for approval
 * @param productId - ID of the product to mark as pending
 * @returns Promise with a boolean indicating success
 */
export const markProductAsPending = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'pendente', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking product as pending:', error);
    return false;
  }
};
