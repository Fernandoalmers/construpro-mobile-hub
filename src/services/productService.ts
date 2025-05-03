
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_anterior?: number;
  categoria: string;
  segmento?: string;
  imagem_url?: string;
  imagens?: string[];
  estoque: number;
  pontos: number;
  loja_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  avaliacao?: number;
}

// Function to track product view
export const trackProductView = async (productId: string): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Create or update recently viewed entry
    await supabase
      .from('recently_viewed')
      .upsert({
        user_id: userData.user.id,
        produto_id: productId,
        data_visualizacao: new Date().toISOString()
      })
      .select();

  } catch (error) {
    console.error('Error tracking product view:', error);
  }
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      // Get approved products only
      const { data, error } = await supabase
        .from('produtos')
        .select('*, vendedores(nome_loja)')
        .eq('status', 'aprovado')
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
  },
  
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, vendedores(nome_loja)')
        .eq('status', 'aprovado')
        .eq('categoria', category)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching products by category ${category}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in getProductsByCategory for ${category}:`, error);
      return [];
    }
  },
  
  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, vendedores(nome_loja, id)')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching product with ID ${id}:`, error);
        return null;
      }
      
      // Track product view
      await trackProductView(id);
      
      return data;
    } catch (error) {
      console.error(`Error in getProductById for ${id}:`, error);
      return null;
    }
  },
  
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, vendedores(nome_loja)')
        .eq('status', 'aprovado')
        .ilike('nome', `%${query}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error searching products with query ${query}:`, error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error(`Error in searchProducts for ${query}:`, error);
      return [];
    }
  },
  
  async getProductCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('categoria')
        .eq('status', 'aprovado')
        .order('categoria');
      
      if (error) {
        console.error('Error fetching product categories:', error);
        return [];
      }
      
      // Extract unique categories
      const categories = [...new Set(data.map(item => item.categoria))];
      return categories;
    } catch (error) {
      console.error('Error in getProductCategories:', error);
      return [];
    }
  }
};
