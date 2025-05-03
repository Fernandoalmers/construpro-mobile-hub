
import { supabase } from '@/integrations/supabase/client';
import { logAdminAction } from '../adminService';
import { AdminProduct, VendorProduct } from './productBase';

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
        lojaId: item.vendedor_id,
        lojaNome: item.vendedores?.nome_loja || 'Loja desconhecida',
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at,
        imagens: Array.isArray(item.imagens) ? item.imagens.filter(img => typeof img === 'string') : []
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

/**
 * Approve a product
 * @param productId - ID of the product to approve
 * @returns Promise with a boolean indicating success
 */
export const approveProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'approve_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'aprovado' }
    });
    
    return true;
  } catch (error) {
    console.error('Error approving product:', error);
    throw error;
  }
};

/**
 * Reject a product
 * @param productId - ID of the product to reject
 * @returns Promise with a boolean indicating success
 */
export const rejectProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'reject_product',
      entityType: 'produto',
      entityId: productId,
      details: { status: 'inativo' }
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting product:', error);
    throw error;
  }
};

/**
 * Update a product's status
 * @param productId - ID of the product
 * @param status - New status
 * @returns Promise with a boolean indicating success
 */
export const updateProductStatus = async (
  productId: string, 
  status: 'pendente' | 'aprovado' | 'inativo'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (error) throw error;
    
    // Log admin action for status changes
    if (status === 'aprovado' || status === 'inativo') {
      await logAdminAction({
        action: status === 'aprovado' ? 'approve_product' : 'reject_product',
        entityType: 'produto',
        entityId: productId,
        details: { status }
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating product status to ${status}:`, error);
    return false;
  }
};
