
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from './vendorProfileService';

// Types
export interface VendorProduct {
  id: string;
  vendedor_id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number;
  estoque: number;
  codigo_barras?: string;
  sku?: string;
  segmento?: string;
  categoria: string;
  pontos_profissional: number;
  pontos_consumidor: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

// Vendor Products Management
export const getVendorProducts = async (): Promise<VendorProduct[]> => {
  try {
    // Get vendor id
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      console.error('Vendor profile not found');
      return [];
    }
    
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching vendor products:', error);
      return [];
    }
    
    return data as VendorProduct[];
  } catch (error) {
    console.error('Error in getVendorProducts:', error);
    return [];
  }
};

export const getVendorProduct = async (id: string): Promise<VendorProduct | null> => {
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
    console.error('Error in getVendorProduct:', error);
    return null;
  }
};

export const saveVendorProduct = async (product: Partial<VendorProduct>): Promise<VendorProduct | null> => {
  try {
    // Get vendor profile
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    // Set vendor_id
    const vendorProduct = {
      ...product,
      vendedor_id: vendorProfile.id
    };
    
    let result;
    
    if (product.id) {
      // Update existing product
      const { data, error } = await supabase
        .from('produtos')
        .update(vendorProduct)
        .eq('id', product.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new product - make sure required fields are provided
      if (!product.nome || !product.descricao || !product.categoria) {
        throw new Error('Nome, descrição e categoria são obrigatórios');
      }
      
      const newProduct = {
        ...vendorProduct,
        nome: product.nome,
        descricao: product.descricao,
        categoria: product.categoria,
        preco_normal: product.preco_normal || 0,
        status: 'pendente' as const
      };
      
      const { data, error } = await supabase
        .from('produtos')
        .insert(newProduct)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return result as VendorProduct;
  } catch (error) {
    console.error('Error saving product:', error);
    toast.error('Erro ao salvar produto');
    return null;
  }
};

export const deleteVendorProduct = async (id: string): Promise<boolean> => {
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

export const updateProductStatus = async (id: string, status: 'pendente' | 'aprovado' | 'inativo'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating product status:', error);
    toast.error('Erro ao atualizar status do produto');
    return false;
  }
};

export const uploadProductImage = async (
  productId: string,
  file: File,
  index = 0
): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const fileName = `${index}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `products/${vendorProfile.id}/${productId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading product image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    return null;
  }
};
