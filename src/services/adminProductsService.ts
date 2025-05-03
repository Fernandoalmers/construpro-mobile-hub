
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logAdminAction } from './adminService';

export interface AdminProduct {
  id: string;
  nome: string;
  imagemUrl: string | null;
  preco: number;
  pontos: number;
  categoria: string;
  lojaId: string;
  lojaNome?: string;
  status: 'pendente' | 'aprovado' | 'inativo';
  created_at?: string;
}

export const fetchAdminProducts = async () => {
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
        imagemUrl: imageUrl,
        preco: item.preco_normal,
        pontos: item.pontos_consumidor || 0,
        categoria: item.categoria,
        lojaId: item.vendedor_id,
        lojaNome: item.vendedores?.nome_loja || 'Loja desconhecida',
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at
      };
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching admin products:', error);
    throw error;
  }
};

export const approveProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado' })
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

export const rejectProduct = async (productId: string) => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'inativo' })
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

export const deleteProduct = async (productId: string) => {
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
      entityId: productId
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const getCategories = async () => {
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

export const getVendors = async () => {
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select('id, nome_loja')
      .order('nome_loja');
      
    if (error) throw error;
    
    return data.map(vendor => ({
      id: vendor.id,
      nome: vendor.nome_loja
    }));
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
};

// Função para configurar subscription de realtime para atualizações de produtos
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
