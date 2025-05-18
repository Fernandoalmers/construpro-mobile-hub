
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '@/services/vendorProfileService';

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  ordem: number;
}

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

// Function to update product images in produtos table
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
export const getProductImages = async (productId: string): Promise<ProductImage[]> => {
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
