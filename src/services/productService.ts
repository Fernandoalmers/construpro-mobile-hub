
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_anterior?: number;
  pontos: number;
  categoria: string;
  imagem_url?: string;
  loja_id: string;
  estoque: number;
  avaliacao: number;
  created_at?: string;
  updated_at?: string;
  loja?: {
    nome: string;
    logo_url?: string;
  };
}

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_normal as preco,
        preco_promocional as preco_anterior,
        pontos_consumidor as pontos,
        categoria,
        imagens,
        vendedor_id as loja_id,
        estoque,
        status,
        created_at,
        updated_at,
        vendedores:vendedor_id (nome_loja as nome, logo as logo_url)
      `)
      .eq('status', 'aprovado')
      .order('nome');
      
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    // Transform the data to match the expected format
    const products = data.map(item => ({
      ...item,
      imagem_url: item.imagens && Array.isArray(item.imagens) && item.imagens.length > 0 
        ? item.imagens[0] 
        : undefined,
      avaliacao: 5, // Default value for now
      loja: item.vendedores
    }));
    
    return products as unknown as Product[];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_normal as preco,
        preco_promocional as preco_anterior,
        pontos_consumidor as pontos,
        categoria,
        imagens,
        vendedor_id as loja_id,
        estoque,
        status,
        created_at,
        updated_at,
        vendedores:vendedor_id (nome_loja as nome, logo as logo_url)
      `)
      .eq('categoria', category)
      .eq('status', 'aprovado')
      .order('nome');
      
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    
    // Transform the data to match the expected format
    const products = data.map(item => ({
      ...item,
      imagem_url: item.imagens && Array.isArray(item.imagens) && item.imagens.length > 0 
        ? item.imagens[0] 
        : undefined,
      avaliacao: 5, // Default value for now
      loja: item.vendedores
    }));
    
    return products as unknown as Product[];
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco_normal as preco,
        preco_promocional as preco_anterior,
        pontos_consumidor as pontos,
        categoria,
        imagens,
        vendedor_id as loja_id,
        estoque,
        status,
        created_at,
        updated_at,
        vendedores:vendedor_id (nome_loja as nome, logo as logo_url)
      `)
      .eq('id', id)
      .eq('status', 'aprovado')
      .single();
      
    if (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
    
    // Transform the data to match the expected format
    const product = {
      ...data,
      imagem_url: data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0 
        ? data.imagens[0] 
        : undefined,
      avaliacao: 5, // Default value for now
      loja: data.vendedores
    };
    
    return product as unknown as Product;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};

// Add or update product review
export const saveProductReview = async (
  productId: string, 
  rating: number, 
  comment?: string
): Promise<boolean> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      return false;
    }
    
    const { error } = await supabase
      .from('product_reviews')
      .insert({
        produto_id: productId,
        cliente_id: user.user.id,
        nota: rating,
        comentario: comment
      });
      
    if (error) {
      console.error('Error saving product review:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveProductReview:', error);
    return false;
  }
};

// Track product view
export const trackProductView = async (productId: string): Promise<void> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return;
    
    await supabase
      .from('recently_viewed')
      .insert({
        user_id: sessionData.session.user.id,
        produto_id: productId
      });
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
};

// Add product
export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
  try {
    // Convert to the new schema format
    const newProduct = {
      nome: product.nome,
      descricao: product.descricao,
      preco_normal: product.preco,
      preco_promocional: product.preco_anterior,
      estoque: product.estoque,
      categoria: product.categoria,
      pontos_consumidor: product.pontos,
      imagens: product.imagem_url ? [product.imagem_url] : [],
      vendedor_id: product.loja_id,
      status: 'pendente' // All new products start as pending
    };
    
    const { data, error } = await supabase
      .from('produtos')
      .insert(newProduct)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding product:', error);
      return null;
    }
    
    // Transform back to the expected format
    const createdProduct = {
      ...data,
      preco: data.preco_normal,
      preco_anterior: data.preco_promocional,
      pontos: data.pontos_consumidor,
      imagem_url: data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0 
        ? data.imagens[0] 
        : undefined,
      loja_id: data.vendedor_id,
      avaliacao: 5 // Default value for now
    };
    
    return createdProduct as unknown as Product;
  } catch (error) {
    console.error('Error in addProduct:', error);
    return null;
  }
};

// Update product
export const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | null> => {
  try {
    // Convert to the new schema format
    const productUpdates: any = {};
    
    if (updates.nome !== undefined) productUpdates.nome = updates.nome;
    if (updates.descricao !== undefined) productUpdates.descricao = updates.descricao;
    if (updates.preco !== undefined) productUpdates.preco_normal = updates.preco;
    if (updates.preco_anterior !== undefined) productUpdates.preco_promocional = updates.preco_anterior;
    if (updates.pontos !== undefined) productUpdates.pontos_consumidor = updates.pontos;
    if (updates.categoria !== undefined) productUpdates.categoria = updates.categoria;
    if (updates.estoque !== undefined) productUpdates.estoque = updates.estoque;
    if (updates.imagem_url !== undefined) {
      productUpdates.imagens = [updates.imagem_url];
    }
    
    const { data, error } = await supabase
      .from('produtos')
      .update(productUpdates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating product:', error);
      return null;
    }
    
    // Transform back to the expected format
    const updatedProduct = {
      ...data,
      preco: data.preco_normal,
      preco_anterior: data.preco_promocional,
      pontos: data.pontos_consumidor,
      imagem_url: data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0 
        ? data.imagens[0] 
        : undefined,
      loja_id: data.vendedor_id,
      avaliacao: 5 // Default value for now
    };
    
    return updatedProduct as unknown as Product;
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return null;
  }
};

// Delete product
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return false;
  }
};
