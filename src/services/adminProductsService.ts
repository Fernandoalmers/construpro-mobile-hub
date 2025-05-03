
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
    console.log('Fetching admin products from Supabase...');
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
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching produtos:', error);
      
      // Fallback to products table if produtos has an error
      console.log('Trying fallback to products table...');
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          nome,
          descricao,
          preco,
          pontos,
          categoria,
          imagem_url,
          loja_id,
          estoque,
          status,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });
        
      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }
      
      console.log(`Found ${productsData?.length || 0} products in 'products' table`);
      
      // Transform products to AdminProduct format
      const transformedProducts: AdminProduct[] = (productsData || []).map(item => {
        return {
          id: item.id,
          nome: item.nome,
          descricao: item.descricao,
          categoria: item.categoria,
          imagemUrl: item.imagem_url,
          preco: item.preco,
          preco_normal: item.preco,
          estoque: item.estoque || 0,
          pontos: item.pontos || 0,
          lojaId: item.loja_id,
          lojaNome: 'Carregando...',  // Will fetch store name separately
          status: (item.status as 'pendente' | 'aprovado' | 'inativo') || 'pendente',
          created_at: item.created_at,
          updated_at: item.updated_at,
          imagens: item.imagem_url ? [item.imagem_url] : []
        };
      });
      
      // Get store names for each product
      const productsWithStoreNames = await Promise.all(
        transformedProducts.map(async (product) => {
          if (!product.lojaId) return product;
          
          try {
            // Try to get store name from lojas table
            const { data: lojaData } = await supabase
              .from('lojas')
              .select('nome')
              .eq('id', product.lojaId)
              .single();
              
            if (lojaData?.nome) {
              return { ...product, lojaNome: lojaData.nome };
            }
            
            // Fallback to stores table
            const { data: storeData } = await supabase
              .from('stores')
              .select('nome')
              .eq('id', product.lojaId)
              .single();
              
            return { ...product, lojaNome: storeData?.nome || 'Loja desconhecida' };
          } catch (error) {
            console.error('Error fetching store name:', error);
            return product;
          }
        })
      );
      
      return productsWithStoreNames;
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
          // Try from vendedores table first
          const { data: vendorData } = await supabase
            .from('vendedores')
            .select('nome_loja')
            .eq('id', item.vendedor_id)
            .single();
            
          if (vendorData?.nome_loja) {
            vendorName = vendorData.nome_loja;
          } else {
            // Try from lojas table
            const { data: lojaData } = await supabase
              .from('lojas')
              .select('nome')
              .eq('id', item.vendedor_id)
              .single();
              
            if (lojaData?.nome) {
              vendorName = lojaData.nome;
            } else {
              // Try from stores table
              const { data: storeData } = await supabase
                .from('stores')
                .select('nome')
                .eq('id', item.vendedor_id)
                .single();
                
              if (storeData?.nome) {
                vendorName = storeData.nome;
              }
            }
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
    const products = await fetchAdminProducts();
    return products.filter(product => product.status === 'pendente');
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
    console.log('Approving product:', productId);
    // Try updating in produtos table first
    let { error } = await supabase
      .from('produtos')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) {
      console.log('Error updating in produtos, trying products table:', error);
      // Try updating in products table if produtos fails
      const { error: productsError } = await supabase
        .from('products')
        .update({ status: 'aprovado', updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (productsError) {
        console.error('Error approving product in both tables:', productsError);
        throw productsError;
      }
    }
    
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
    console.log('Rejecting product:', productId);
    // Try updating in produtos table first
    let { error } = await supabase
      .from('produtos')
      .update({ status: 'inativo', updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) {
      console.log('Error updating in produtos, trying products table:', error);
      // Try updating in products table if produtos fails
      const { error: productsError } = await supabase
        .from('products')
        .update({ status: 'inativo', updated_at: new Date().toISOString() })
        .eq('id', productId);
      
      if (productsError) {
        console.error('Error rejecting product in both tables:', productsError);
        throw productsError;
      }
    }
    
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
    // Try deleting from produtos table first
    let { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);
      
    if (error) {
      // Try deleting from products table if produtos fails
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (productsError) {
        console.error('Error deleting product from both tables:', productsError);
        throw productsError;
      }
    }
    
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
      
    if (error) {
      console.log('Error fetching categories from produtos, trying products:', error);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('categoria')
        .order('categoria');
        
      if (productsError) {
        console.error('Error fetching categories from both tables:', productsError);
        return [];
      }
      
      const uniqueCategories = Array.from(new Set(productsData.map(item => item.categoria)))
        .filter(Boolean) // Remove null or empty values
        .sort();
        
      return uniqueCategories;
    }
    
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
      // Try with lojas table as a last resort
      const { data: lojasData, error: lojasError } = await supabase
        .from('lojas')
        .select('id, nome')
        .order('nome');
        
      if (lojasError) {
        console.error('Error fetching vendors from all tables:', lojasError);
        return [];
      }
      
      return lojasData.map(loja => ({
        id: loja.id,
        nome: loja.nome
      }));
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

// Function to enable manually getting product data for debugging
export const debugFetchProducts = async () => {
  console.log("DEBUG: Fetching products directly from Supabase");
  
  try {
    // Try produtos table
    const { data: produtosData, error: produtosError } = await supabase
      .from('produtos')
      .select('*')
      .limit(5);
      
    console.log("DEBUG: produtos table data:", produtosData);
    console.log("DEBUG: produtos table error:", produtosError);
    
    // Try products table
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
      
    console.log("DEBUG: products table data:", productsData);
    console.log("DEBUG: products table error:", productsError);
    
    return {
      produtos: { data: produtosData, error: produtosError },
      products: { data: productsData, error: productsError }
    };
  } catch (error) {
    console.error("DEBUG: Error in debug fetch:", error);
    return { error };
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
