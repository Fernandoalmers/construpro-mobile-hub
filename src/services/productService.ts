
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

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
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `)
      .order('nome');
      
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data as unknown as Product[] || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `)
      .eq('categoria', category)
      .order('nome');
      
    if (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
    
    return data as unknown as Product[] || [];
  } catch (error) {
    console.error('Error in getProductsByCategory:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        stores:loja_id (nome, logo_url)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching product by ID:', error);
      return null;
    }
    
    return data as unknown as Product;
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

// Add store product
export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding product:', error);
      return null;
    }
    
    return data as unknown as Product;
  } catch (error) {
    console.error('Error in addProduct:', error);
    return null;
  }
};

// Update store product
export const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating product:', error);
      return null;
    }
    
    return data as unknown as Product;
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return null;
  }
};

// Delete product
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
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
