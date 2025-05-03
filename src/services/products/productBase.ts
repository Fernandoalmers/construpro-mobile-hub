
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Base product interface with common properties
 */
export interface BaseProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_normal: number;
  preco_promocional?: number;
  estoque: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

/**
 * Product interface with vendor-specific properties
 */
export interface VendorProduct extends BaseProduct {
  vendedor_id: string;
  pontos_consumidor: number;
  pontos_profissional: number;
  codigo_barras?: string;
  sku?: string;
  segmento?: string;
}

/**
 * Product interface with admin-specific properties
 */
export interface AdminProduct extends BaseProduct {
  imagemUrl: string | null;
  preco: number;
  pontos: number;
  lojaId: string;
  lojaNome?: string;
}

/**
 * Get products for a specific vendor
 * @param vendorId - The vendor's ID
 * @returns Promise with an array of vendor products
 */
export const getProductsByVendor = async (vendorId: string): Promise<VendorProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('vendedor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching vendor products:', error);
      return [];
    }
    
    return data as VendorProduct[];
  } catch (error) {
    console.error('Error in getProductsByVendor:', error);
    return [];
  }
};

/**
 * Get a specific product by ID
 * @param id - The product ID
 * @returns Promise with the product object or null
 */
export const getProductById = async (id: string): Promise<VendorProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }
    
    return data as VendorProduct;
  } catch (error) {
    console.error('Error in getProductById:', error);
    return null;
  }
};

/**
 * Create a new product
 * @param product - The product to create
 * @returns Promise with the created product or null
 */
export const createProduct = async (product: Partial<VendorProduct>): Promise<VendorProduct | null> => {
  try {
    // Make sure required fields are present
    if (!product.nome || !product.descricao || !product.categoria || !product.vendedor_id) {
      throw new Error('Nome, descrição, categoria e vendedor são obrigatórios');
    }
    
    const newProduct = {
      ...product,
      status: 'pendente' as const,
      preco_normal: product.preco_normal || 0,
      estoque: product.estoque || 0
    };
    
    const { data, error } = await supabase
      .from('produtos')
      .insert(newProduct)
      .select()
      .single();
    
    if (error) throw error;
    return data as VendorProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    toast.error('Erro ao criar produto');
    return null;
  }
};

/**
 * Update an existing product
 * @param product - The product to update
 * @returns Promise with the updated product or null
 */
export const updateProduct = async (product: Partial<VendorProduct>): Promise<VendorProduct | null> => {
  try {
    if (!product.id) {
      throw new Error('ID do produto é obrigatório para atualização');
    }
    
    // Mark product as pending when updated
    const productToUpdate = {
      ...product,
      status: 'pendente' as const, // Always mark as pending when edited
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('produtos')
      .update(productToUpdate)
      .eq('id', product.id)
      .select()
      .single();
    
    if (error) throw error;
    return data as VendorProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    toast.error('Erro ao atualizar produto');
    return null;
  }
};

/**
 * Delete a product
 * @param id - The ID of the product to delete
 * @returns Promise with a boolean indicating success
 */
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    toast.error('Erro ao excluir produto');
    return false;
  }
};

/**
 * Get all products for admin view
 * @returns Promise with an array of admin products
 */
export const getAllProducts = async (): Promise<AdminProduct[]> => {
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
        descricao: item.descricao,
        categoria: item.categoria,
        imagemUrl: imageUrl,
        preco: item.preco_normal,
        preco_normal: item.preco_normal,
        estoque: item.estoque,
        pontos: item.pontos_consumidor || 0,
        lojaId: item.vendedor_id,
        lojaNome: item.vendedores?.nome_loja || 'Loja desconhecida',
        status: item.status as 'pendente' | 'aprovado' | 'inativo',
        created_at: item.created_at,
        imagens: item.imagens
      };
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching admin products:', error);
    throw error;
  }
};

/**
 * Get product categories
 * @returns Promise with an array of unique categories
 */
export const getCategories = async (): Promise<string[]> => {
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

/**
 * Get vendors list
 * @returns Promise with vendors data
 */
export const getVendors = async (): Promise<{ id: string; nome: string }[]> => {
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
