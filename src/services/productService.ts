import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Json } from '@/integrations/supabase/types';

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
  pontos_consumidor?: number;
  loja_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  avaliacao?: number;
  num_avaliacoes?: number;
  unidade_medida?: string;
  stores?: {
    id?: string;
    nome?: string;
    nome_loja?: string;
    logo_url?: string;
  };
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

// Transform database product to match Product interface
const transformProduct = (dbProduct: any): Product => {
  return {
    id: dbProduct.id,
    nome: dbProduct.nome,
    descricao: dbProduct.descricao,
    preco: dbProduct.preco_normal || 0,
    preco_anterior: dbProduct.preco_promocional,
    categoria: dbProduct.categoria,
    segmento: dbProduct.segmento,
    imagem_url: Array.isArray(dbProduct.imagens) && dbProduct.imagens.length > 0 
      ? dbProduct.imagens[0] 
      : undefined,
    imagens: Array.isArray(dbProduct.imagens) ? dbProduct.imagens : [],
    estoque: dbProduct.estoque || 0,
    pontos: dbProduct.pontos_consumidor || 0,
    pontos_consumidor: dbProduct.pontos_consumidor || 0,
    loja_id: dbProduct.vendedor_id,
    status: dbProduct.status,
    avaliacao: dbProduct.avaliacao,
    num_avaliacoes: dbProduct.num_avaliacoes || 0,
    unidade_medida: dbProduct.unidade_medida || 'unidade',
    stores: dbProduct.vendedores ? {
      id: dbProduct.vendedor_id,
      nome: dbProduct.vendedores.nome_loja,
      nome_loja: dbProduct.vendedores.nome_loja,
      logo_url: dbProduct.vendedores.logo_url
    } : undefined
  };
};

// Individual function exports
export async function getProducts(): Promise<Product[]> {
  try {
    console.log('[productService] Fetching approved products with stock > 0');
    
    // Get approved products only with stock > 0
    const { data, error } = await supabase
      .from('produtos')
      .select('*, vendedores(nome_loja)')
      .eq('status', 'aprovado')  // Explicitly check for 'aprovado' status
      .gt('estoque', 0)  // Only products with stock > 0
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[productService] Error fetching products:', error);
      return [];
    }
    
    console.log(`[productService] Fetched ${data?.length || 0} approved products with data:`, data);
    return data.map(transformProduct) || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, vendedores(nome_loja)')
      .eq('status', 'aprovado')
      .gt('estoque', 0)  // Added filter for stock > 0
      .eq('categoria', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching products by category ${category}:`, error);
      return [];
    }
    
    return data.map(transformProduct) || [];
  } catch (error) {
    console.error(`Error in getProductsByCategory for ${category}:`, error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, vendedores(nome_loja, id, logo_url)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      return null;
    }
    
    // Track product view
    await trackProductView(id);
    
    return transformProduct(data);
  } catch (error) {
    console.error(`Error in getProductById for ${id}:`, error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*, vendedores(nome_loja)')
      .eq('status', 'aprovado')
      .gt('estoque', 0)  // Added filter for stock > 0
      .ilike('nome', `%${query}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error searching products with query ${query}:`, error);
      return [];
    }
    
    return data.map(transformProduct) || [];
  } catch (error) {
    console.error(`Error in searchProducts for ${query}:`, error);
    return [];
  }
}

export async function getProductCategories(): Promise<string[]> {
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

// Keep the object for backward compatibility
export const productService = {
  getProducts,
  getProductsByCategory,
  getProductById,
  searchProducts,
  getProductCategories
};
