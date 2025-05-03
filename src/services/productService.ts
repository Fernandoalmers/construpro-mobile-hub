
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_anterior?: number;
  imagem_url?: string;
  categoria: string;
  segmento?: string;
  estoque: number;
  pontos?: number;
  loja_id?: string;
  status: string;
  avaliacao?: number;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch products that are approved
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'aprovado')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('categoria', category)
      .eq('status', 'aprovado')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    return [];
  }
};

export const getProductsByStore = async (storeId: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('loja_id', storeId)
      .eq('status', 'aprovado')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products by store:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProductsByStore:', error);
    return [];
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`nome.ilike.%${query}%,descricao.ilike.%${query}%`)
      .eq('status', 'aprovado')
      .gt('estoque', 0)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return [];
  }
};

export const getProductCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('categoria')
      .eq('status', 'aprovado')
      .gt('estoque', 0);
    
    if (error) {
      console.error('Error fetching product categories:', error);
      return [];
    }
    
    const categories = data.map(item => item.categoria);
    return [...new Set(categories)]; // Remove duplicates
  } catch (error) {
    console.error('Error in getProductCategories:', error);
    return [];
  }
};

export const syncVendorProductsToMarketplace = async (): Promise<boolean> => {
  try {
    // Get all approved vendor products
    const { data: vendorProducts, error: vendorError } = await supabase
      .from('produtos')
      .select('*')
      .eq('status', 'aprovado');
    
    if (vendorError) {
      console.error('Error fetching vendor products:', vendorError);
      return false;
    }
    
    // For each vendor product, check if it exists in the marketplace
    for (const product of vendorProducts) {
      // Check if product already exists
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('id', product.id)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing product:', checkError);
        continue;
      }
      
      // Get first product image
      const { data: images } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', product.id)
        .eq('is_primary', true)
        .limit(1);
      
      const primaryImage = images && images.length > 0 ? images[0].url : null;
      
      if (!existingProduct) {
        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            id: product.id,
            nome: product.nome,
            descricao: product.descricao,
            preco: product.preco_normal,
            preco_anterior: product.preco_promocional,
            imagem_url: primaryImage || (product.imagens && product.imagens[0]),
            categoria: product.categoria,
            segmento: product.segmento,
            estoque: product.estoque,
            pontos: product.pontos_consumidor,
            loja_id: product.vendedor_id,
            status: product.status
          });
          
        if (insertError) {
          console.error('Error inserting product to marketplace:', insertError);
        }
      } else {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            nome: product.nome,
            descricao: product.descricao,
            preco: product.preco_normal,
            preco_anterior: product.preco_promocional,
            imagem_url: primaryImage || (product.imagens && product.imagens[0]),
            categoria: product.categoria,
            segmento: product.segmento,
            estoque: product.estoque,
            pontos: product.pontos_consumidor,
            loja_id: product.vendedor_id,
            status: product.status
          })
          .eq('id', product.id);
          
        if (updateError) {
          console.error('Error updating product in marketplace:', updateError);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in syncVendorProductsToMarketplace:', error);
    return false;
  }
};

// Add product to user's recently viewed
export const addToRecentlyViewed = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return false;
    }
    
    // Check if already viewed recently
    const { data: existingView } = await supabase
      .from('recently_viewed')
      .select('id')
      .eq('produto_id', productId)
      .eq('user_id', userData.user.id)
      .single();
      
    if (existingView) {
      // Update timestamp on existing view
      const { error: updateError } = await supabase
        .from('recently_viewed')
        .update({ data_visualizacao: new Date().toISOString() })
        .eq('id', existingView.id);
        
      if (updateError) {
        console.error('Error updating recently viewed:', updateError);
        return false;
      }
    } else {
      // Add new view
      const { error: insertError } = await supabase
        .from('recently_viewed')
        .insert({
          produto_id: productId,
          user_id: userData.user.id
        });
        
      if (insertError) {
        console.error('Error adding to recently viewed:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in addToRecentlyViewed:', error);
    return false;
  }
};

// Get recently viewed products
export const getRecentlyViewedProducts = async (): Promise<Product[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('recently_viewed')
      .select(`
        produto_id,
        data_visualizacao,
        products:produto_id (*)
      `)
      .eq('user_id', userData.user.id)
      .order('data_visualizacao', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error fetching recently viewed products:', error);
      return [];
    }
    
    return data.map(item => item.products) || [];
  } catch (error) {
    console.error('Error in getRecentlyViewedProducts:', error);
    return [];
  }
};
