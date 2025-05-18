
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Define the Product interface
export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco?: number;
  preco_normal: number;
  preco_promocional?: number;
  preco_anterior?: number;
  categoria: string;
  segmento?: string;
  segmento_id?: string;
  imagem_url?: string;
  imagens: string[];
  estoque: number;
  pontos?: number;
  pontos_consumidor?: number;
  pontos_profissional?: number;
  loja_id?: string;
  vendedor_id?: string;
  status: "pendente" | "aprovado" | "rejeitado";
  unidade_medida?: string;
  codigo_barras?: string;
  sku?: string;
  avaliacao?: number;
  num_avaliacoes?: number;
  stores?: {
    id: string;
    nome: string;
    nome_loja: string;
    logo_url?: string;
  };
}

// Type for the raw database response
type ProductDatabaseRecord = {
  id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number;
  preco_anterior?: number;
  categoria: string;
  segmento?: string;
  segmento_id?: string;
  imagem_url?: string;
  imagens: any; // Could be Json, string[], etc.
  estoque: number;
  pontos_consumidor?: number;
  pontos_profissional?: number;
  vendedor_id?: string;
  status: "pendente" | "aprovado" | "rejeitado";
  codigo_barras?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow other properties
};

// Transform database record to Product type
const transformToProduct = (record: ProductDatabaseRecord): Product => {
  // Ensure imagens is properly cast to string[]
  let imagens: string[] = [];
  
  if (Array.isArray(record.imagens)) {
    imagens = record.imagens.map(img => String(img));
  } else if (record.imagens && typeof record.imagens === 'object') {
    // Handle case when imagens is a JSON object
    try {
      const parsed = record.imagens;
      imagens = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      console.error('Error parsing imagens:', e);
      imagens = [];
    }
  } else if (typeof record.imagens === 'string') {
    // If it's a string, try to parse it as JSON
    try {
      const parsed = JSON.parse(record.imagens);
      imagens = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      // If parsing fails, it might be a single image URL
      imagens = [String(record.imagens)];
    }
  }

  return {
    id: record.id,
    nome: record.nome,
    descricao: record.descricao,
    preco_normal: record.preco_normal,
    preco_promocional: record.preco_promocional,
    preco_anterior: record.preco_anterior,
    categoria: record.categoria,
    segmento: record.segmento,
    segmento_id: record.segmento_id,
    imagem_url: record.imagem_url,
    imagens: imagens,
    estoque: record.estoque,
    pontos_consumidor: record.pontos_consumidor || 0,
    pontos_profissional: record.pontos_profissional || 0,
    vendedor_id: record.vendedor_id,
    status: record.status,
    codigo_barras: record.codigo_barras,
    sku: record.sku
  };
};

// Get all approved products
export const getProducts = async (filters = {}): Promise<Product[]> => {
  try {
    let query = supabase
      .from('produtos')
      .select('*')
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false });
    
    // Apply any additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    // Transform each record to ensure type compatibility
    return (data || []).map(transformToProduct);
  } catch (error) {
    console.error('Error in getProducts:', error);
    toast.error('Erro ao carregar produtos');
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the record to ensure type compatibility
    return transformToProduct(data);
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};
