import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '@/services/vendorProfileService';
import { VendorProduct, VendorProductInput } from './types';

// Vendor Products Fetching
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
    
    console.log('[VendorProducts] fetched:', data);
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
    
    console.log('[VendorProducts] getVendorProduct:', data);
    return data as VendorProduct;
  } catch (error) {
    console.error('Error in getVendorProduct:', error);
    return null;
  }
};

export const saveVendorProduct = async (product: VendorProductInput): Promise<VendorProduct | null> => {
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
    
    console.log('[VendorProducts] saving product:', vendorProduct);
    
    let result;
    
    if (product.id) {
      // Verify ownership before update
      const { data: existingProduct, error: fetchError } = await supabase
        .from('produtos')
        .select('vendedor_id, segmento, categoria')
        .eq('id', product.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching existing product:', fetchError);
        toast.error('Erro ao verificar produto existente');
        return null;
      }
      
      if (!existingProduct || existingProduct.vendedor_id !== vendorProfile.id) {
        toast.error('Você não tem permissão para editar este produto');
        return null;
      }
      
      // Prepare data for update
      const dataToUpdate = {
        ...vendorProduct,
        // Keep the existing values if not provided in the update
        segmento: vendorProduct.segmento !== undefined ? vendorProduct.segmento : existingProduct.segmento,
        categoria: vendorProduct.categoria !== undefined ? vendorProduct.categoria : existingProduct.categoria,
        // Handle segmento_id with default fallback to null if not provided
        segmento_id: vendorProduct.segmento_id !== undefined ? vendorProduct.segmento_id : null,
        status: 'pendente' // Always set to pending when edited
      };
      
      console.log('[VendorProducts] updating product:', product.id, dataToUpdate);
      
      // Update existing product
      const { data, error } = await supabase
        .from('produtos')
        .update(dataToUpdate)
        .eq('id', product.id)
        .select()
        .single();
      
      console.log('[VendorProducts] update result:', data, error);
      
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
        segmento: product.segmento || null,
        segmento_id: product.segmento_id || null,
        preco_normal: product.preco_normal || 0,
        status: 'pendente' as const
      };
      
      console.log('[VendorProducts] inserting new product:', newProduct);
      
      const { data, error } = await supabase
        .from('produtos')
        .insert(newProduct)
        .select()
        .single();
      
      console.log('[VendorProducts] insert result:', data, error);
      
      if (error) throw error;
      result = data;
    }
    
    toast.success(product.id ? 'Produto atualizado e enviado para aprovação' : 'Produto cadastrado com sucesso');
    
    return result as VendorProduct;
  } catch (error) {
    console.error('Error saving product:', error);
    toast.error('Erro ao salvar produto');
    return null;
  }
};

export const deleteVendorProduct = async (id: string): Promise<boolean> => {
  try {
    console.log('[VendorProducts] deleting product:', id);
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);
    
    console.log('[VendorProducts] delete result:', error ? error : 'success');
    
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
    console.log('[VendorProducts] updating status:', id, status);
    
    const { error } = await supabase
      .from('produtos')
      .update({ status })
      .eq('id', id);
    
    console.log('[VendorProducts] status update result:', error ? error : 'success');
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating product status:', error);
    toast.error('Erro ao atualizar status do produto');
    return false;
  }
};
