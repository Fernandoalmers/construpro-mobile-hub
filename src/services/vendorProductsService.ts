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
      // Verify ownership before update
      const { data: existingProduct } = await supabase
        .from('produtos')
        .select('vendedor_id')
        .eq('id', product.id)
        .single();
      
      if (!existingProduct || existingProduct.vendedor_id !== vendorProfile.id) {
        toast.error('Você não tem permissão para editar este produto');
        return null;
      }
      
      // Marcar produto como pendente quando for editado
      const productToUpdate = {
        ...vendorProduct,
        status: 'pendente' // Sempre volta para pendente ao editar
      };
      
      // Update existing product
      const { data, error } = await supabase
        .from('produtos')
        .update(productToUpdate)
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

// Função para configurar assinatura em tempo real para produtos de um vendedor
export const subscribeToVendorProducts = (
  vendorId: string, 
  callback: (product: VendorProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  return supabase
    .channel('vendor-products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos',
        filter: `vendedor_id=eq.${vendorId}`
      },
      (payload) => {
        console.log('Produto atualizado:', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new as VendorProduct;
        callback(product, eventType);
      }
    )
    .subscribe();
};

// Função para configurar assinatura em tempo real para todos os produtos (uso administrativo)
export const subscribeToAllProducts = (
  callback: (product: VendorProduct, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  return supabase
    .channel('all-products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'produtos'
      },
      (payload) => {
        console.log('Produto atualizado (Admin):', payload);
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const product = payload.new as VendorProduct;
        callback(product, eventType);
      }
    )
    .subscribe();
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
    
    const fileName = `${Date.now()}-${index}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `products/${vendorProfile.id}/${productId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading product image:', uploadError);
      toast.error('Erro ao fazer upload da imagem: ' + uploadError.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    // Save image in product_images table
    const { error: imageError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrlData.publicUrl,
        is_primary: index === 0,
        ordem: index
      });
      
    if (imageError) {
      console.error('Error saving product image reference:', imageError);
    }
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    toast.error('Erro ao processar imagem');
    return null;
  }
};

// New function to update product images
export const updateProductImages = async (productId: string, imageUrls: string[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ imagens: imageUrls, status: 'pendente' }) // Marca como pendente ao atualizar imagens
      .eq('id', productId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating product images:', error);
    toast.error('Erro ao atualizar imagens do produto');
    return false;
  }
};

// Function to get product images from the product_images table
export const getProductImages = async (productId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('ordem', { ascending: true });
    
    if (error) {
      console.error('Error fetching product images:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getProductImages:', error);
    return [];
  }
};

// Function to update an existing product image
export const updateProductImage = async (
  imageId: string,
  updates: { is_primary?: boolean; ordem?: number }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', imageId);
    
    if (error) {
      console.error('Error updating product image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateProductImage:', error);
    return false;
  }
};

// Function to delete a product image
export const deleteProductImage = async (imageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);
    
    if (error) {
      console.error('Error deleting product image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    return false;
  }
};
