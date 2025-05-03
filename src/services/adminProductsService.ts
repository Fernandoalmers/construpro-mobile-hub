
// Re-export admin product services for backward compatibility
import { logAdminAction } from './adminService';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminProduct } from '@/types/admin';

/**
 * Fetch all products for admin management
 */
export const fetchAdminProducts = async (): Promise<AdminProduct[]> => {
  try {
    const { data, error } = await supabase
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
        vendedores:vendedor_id (id, nome_loja)
      `)
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
        preco_promocional: item.preco_promocional,
        estoque: item.estoque,
        pontos: item.pontos_consumidor || 0,
        pontos_consumidor: item.pontos_consumidor || 0,
        pontos_profissional: item.pontos_profissional || 0,
        lojaId: item.vendedor_id,
        vendedor_id: item.vendedor_id,
        lojaNome: item.vendedores?.nome_loja || 'Loja desconhecida',
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at,
        updated_at: item.updated_at,
        imagens: Array.isArray(item.imagens) ? item.imagens.filter(img => typeof img === 'string') : []
      };
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching admin products:', error);
    toast.error('Erro ao carregar produtos');
    throw error;
  }
};

/**
 * Fetch pending products for admin approval
 */
export const fetchPendingProducts = async (): Promise<AdminProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_normal,
        preco_promocional,
        pontos_consumidor,
        categoria,
        imagens,
        vendedor_id,
        estoque,
        status,
        created_at,
        updated_at,
        vendedores:vendedor_id (id, nome_loja)
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
        preco_promocional: item.preco_promocional,
        estoque: item.estoque,
        pontos: item.pontos_consumidor || 0,
        pontos_consumidor: item.pontos_consumidor || 0,
        lojaId: item.vendedor_id,
        vendedor_id: item.vendedor_id,
        lojaNome: item.vendedores?.nome_loja || 'Loja desconhecida',
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at,
        updated_at: item.updated_at,
        imagens: Array.isArray(item.imagens) ? item.imagens.filter(img => typeof img === 'string') : []
      };
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching pending products:', error);
    toast.error('Erro ao carregar produtos pendentes');
    throw error;
  }
};

/**
 * Approve a product
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
    
    toast.success('Produto aprovado com sucesso');
    return true;
  } catch (error) {
    console.error('Error approving product:', error);
    toast.error('Erro ao aprovar produto');
    return false;
  }
};

/**
 * Reject a product
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
    
    toast.success('Produto rejeitado com sucesso');
    return true;
  } catch (error) {
    console.error('Error rejecting product:', error);
    toast.error('Erro ao rejeitar produto');
    return false;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
    
    // Log the admin action
    await logAdminAction({
      action: 'delete_product',
      entityType: 'produto',
      entityId: productId,
      details: { action: 'delete' }
    });
    
    toast.success('Produto excluído com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error('Erro ao excluir produto');
    return false;
  }
};

/**
 * Get product categories
 */
export const getCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('categoria')
      .order('categoria');
      
    if (error) throw error;
    
    // Extract unique categories
    const uniqueCategories = Array.from(new Set(data.map(item => item.categoria)))
      .filter(Boolean) // Remove null or empty values
      .sort();
      
    return uniqueCategories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Get vendors list
 */
export const getVendors = async (): Promise<{ id: string; nome: string }[]> => {
  try {
    // Try first with vendedores table
    const { data: vendedoresData, error: vendedoresError } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .order('nome_loja');
      
    if (!vendedoresError && vendedoresData) {
      return vendedoresData.map(vendor => ({
        id: vendor.id,
        nome: vendor.nome_loja
      }));
    }
    
    // Fallback to stores table if vendedores has an error
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, nome')
      .order('nome');
      
    if (storesError) {
      console.error('Error fetching vendors from both tables:', storesError);
      return [];
    }
    
    return storesData.map(store => ({
      id: store.id,
      nome: store.nome
    }));
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
};

/**
 * Function to configure subscription for realtime product updates
 */
export const subscribeToAdminProductUpdates = (
  callback: (product: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  return supabase
    .channel('admin-products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos'
      },
      (payload) => {
        console.log('Produto atualizado (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new;
        callback(product, eventType);
      }
    )
    .subscribe();
};

export type { AdminProduct };
