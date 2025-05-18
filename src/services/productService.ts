
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Define a separate interface for store information
interface StoreInfo {
  id: string;
  nome: string;
  nome_loja: string;
  logo_url?: string;
}

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
  status: string;
  unidade_medida?: string;
  codigo_barras?: string;
  sku?: string;
  avaliacao?: number;
  num_avaliacoes?: number;
  stores?: StoreInfo;
}

// Define a separate interface for the raw database response
interface ProductDatabaseRecord {
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
  status: string;
  codigo_barras?: string;
  sku?: string;
  created_at?: string;
  updated_at?: string;
  vendedores?: { 
    nome_loja?: string;
    logo_url?: string;
  } | null;
}

// Transform database record to Product type
const transformToProduct = (record: ProductDatabaseRecord): Product => {
  // Process images array
  let imagens: string[] = [];
  
  if (Array.isArray(record.imagens)) {
    imagens = record.imagens.map(img => String(img));
  } else if (record.imagens && typeof record.imagens === 'object') {
    try {
      const parsed = record.imagens;
      imagens = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      console.error('Error parsing imagens:', e);
      imagens = [];
    }
  } else if (typeof record.imagens === 'string') {
    try {
      const parsed = JSON.parse(record.imagens);
      imagens = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (e) {
      // If parsing fails, it might be a single image URL
      imagens = [String(record.imagens)];
    }
  }

  // Create a product object with only the necessary fields
  const product: Product = {
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

  return product;
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
    return (data || []).map(item => transformToProduct(item as unknown as ProductDatabaseRecord));
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
        vendedores:vendedor_id (nome_loja, logo_url)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the record to ensure type compatibility
    const product = transformToProduct(data as unknown as ProductDatabaseRecord);
    
    // Add store information if available
    if (data.vendedores && typeof data.vendedores === 'object' && data.vendedores !== null) {
      const vendedorData = data.vendedores;
      
      // Use null coalescing to safely handle potentially null values
      product.stores = {
        id: data.vendedor_id || '',
        nome: vendedorData?.nome_loja || '',
        nome_loja: vendedorData?.nome_loja || '',
        logo_url: vendedorData?.logo_url || undefined
      };
    }
    
    return product;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};
