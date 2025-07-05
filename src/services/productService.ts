
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Define a separate interface for store information
interface StoreInfo {
  id: string;
  nome: string;
  nome_loja: string;
  logo_url?: string;
}

// Define a separate interface for vendor information
interface VendorInfo {
  id: string;
  nome?: string;
  nome_loja: string;
  logo?: string;
  telefone?: string;
  email?: string;
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
  promocao_ativa?: boolean;
  promocao_inicio?: string;
  promocao_fim?: string;
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
  valor_conversao?: number;
  codigo_barras?: string;
  sku?: string;
  avaliacao?: number;
  num_avaliacoes?: number;
  stores?: StoreInfo;
  vendedores?: VendorInfo;
}

// Simple database record interface to ensure type safety
interface ProductDatabaseRecord {
  id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number | null;
  preco_anterior?: number | null;
  promocao_ativa?: boolean | null;
  promocao_inicio?: string | null;
  promocao_fim?: string | null;
  categoria: string;
  segmento?: string | null;
  segmento_id?: string | null;
  imagem_url?: string | null;
  imagens: any;  // Using any here since the data structure varies
  estoque: number;
  pontos_consumidor?: number | null;
  pontos_profissional?: number | null;
  vendedor_id?: string | null;
  status: string;
  codigo_barras?: string | null;
  sku?: string | null;
  unidade_medida?: string | null;
  valor_conversao?: number | null;
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
    preco_promocional: record.preco_promocional || undefined,
    preco_anterior: record.preco_anterior || undefined,
    promocao_ativa: record.promocao_ativa || undefined,
    promocao_inicio: record.promocao_inicio || undefined,
    promocao_fim: record.promocao_fim || undefined,
    categoria: record.categoria,
    segmento: record.segmento || undefined,
    segmento_id: record.segmento_id || undefined,
    imagem_url: record.imagem_url || undefined,
    imagens: imagens,
    estoque: record.estoque,
    pontos_consumidor: record.pontos_consumidor || 0,
    pontos_profissional: record.pontos_profissional || 0,
    vendedor_id: record.vendedor_id || undefined,
    status: record.status,
    unidade_medida: record.unidade_medida || undefined,
    valor_conversao: record.valor_conversao || undefined,
    codigo_barras: record.codigo_barras || undefined,
    sku: record.sku || undefined
  };

  return product;
};

// Get all approved products
export const getProducts = async (filters = {}): Promise<Product[]> => {
  try {
    // Fix: Use explicit type annotation for the query result to avoid deep type instantiation
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('status', 'aprovado')
      .order('created_at', { ascending: false })
      .returns<any[]>(); // Use explicit return type to avoid deep instantiation
    
    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Create a new array to hold our products
    const products: Product[] = [];
    
    // Use a traditional for loop to avoid complex type inference
    for (let i = 0; i < data.length; i++) {
      // Use a type assertion to bypass complex type inference
      const rawRecord = data[i] as any;
      
      // Map the data to our ProductDatabaseRecord type
      const record: ProductDatabaseRecord = {
        id: rawRecord.id,
        nome: rawRecord.nome,
        descricao: rawRecord.descricao,
        preco_normal: rawRecord.preco_normal,
        preco_promocional: rawRecord.preco_promocional,
        preco_anterior: rawRecord.preco_anterior,
        promocao_ativa: rawRecord.promocao_ativa,
        promocao_inicio: rawRecord.promocao_inicio,
        promocao_fim: rawRecord.promocao_fim,
        categoria: rawRecord.categoria,
        segmento: rawRecord.segmento,
        segmento_id: rawRecord.segmento_id,
        imagem_url: rawRecord.imagem_url,
        imagens: rawRecord.imagens,
        estoque: rawRecord.estoque,
        pontos_consumidor: rawRecord.pontos_consumidor,
        pontos_profissional: rawRecord.pontos_profissional,
        vendedor_id: rawRecord.vendedor_id,
        status: rawRecord.status,
        codigo_barras: rawRecord.codigo_barras,
        sku: rawRecord.sku,
        unidade_medida: rawRecord.unidade_medida,
        valor_conversao: rawRecord.valor_conversao
      };
      
      // Transform the record and add it to our products array
      products.push(transformToProduct(record));
    }
    
    return products;
  } catch (error) {
    console.error('Error in getProducts:', error);
    toast.error('Erro ao carregar produtos');
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    // Fix: Use explicit type annotation for the query result
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        vendedores:vendedor_id (nome_loja, logo_url)
      `)
      .eq('id', id)
      .single()
      .returns<any>(); // Use explicit return type to avoid deep instantiation
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Use a simple type assertion to avoid complex type inference
    const rawRecord = data as any;
    
    // Map the data to our ProductDatabaseRecord type
    const record: ProductDatabaseRecord = {
      id: rawRecord.id,
      nome: rawRecord.nome,
      descricao: rawRecord.descricao,
      preco_normal: rawRecord.preco_normal,
      preco_promocional: rawRecord.preco_promocional,
      preco_anterior: rawRecord.preco_anterior,
      promocao_ativa: rawRecord.promocao_ativa,
      promocao_inicio: rawRecord.promocao_inicio,
      promocao_fim: rawRecord.promocao_fim,
      categoria: rawRecord.categoria,
      segmento: rawRecord.segmento,
      segmento_id: rawRecord.segmento_id,
      imagem_url: rawRecord.imagem_url,
      imagens: rawRecord.imagens,
      estoque: rawRecord.estoque,
      pontos_consumidor: rawRecord.pontos_consumidor,
      pontos_profissional: rawRecord.pontos_profissional,
      vendedor_id: rawRecord.vendedor_id,
      status: rawRecord.status,
      codigo_barras: rawRecord.codigo_barras,
      sku: rawRecord.sku,
      unidade_medida: rawRecord.unidade_medida,
      valor_conversao: rawRecord.valor_conversao,
      vendedores: rawRecord.vendedores
    };
    
    const product = transformToProduct(record);
    
    // Add store information if available
    if (rawRecord.vendedores && typeof rawRecord.vendedores === 'object' && rawRecord.vendedores !== null) {
      const vendedorData = rawRecord.vendedores;
      
      product.stores = {
        id: rawRecord.vendedor_id || '',
        nome: vendedorData.nome_loja || '',
        nome_loja: vendedorData.nome_loja || '',
        logo_url: vendedorData.logo_url
      };
    }
    
    return product;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};
