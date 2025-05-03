
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '../vendorProfileService';
import { markProductAsPending } from './productApproval';

/**
 * Interface for product image data
 */
export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  ordem: number;
  created_at: string;
}

/**
 * Upload a product image
 * @param productId - ID of the product
 * @param file - The file to upload
 * @param index - Position index for the image
 * @returns Promise with the public URL of the uploaded image or null
 */
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

    // Mark product as pending after image upload
    await markProductAsPending(productId);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    toast.error('Erro ao processar imagem');
    return null;
  }
};

/**
 * Update product images array
 * @param productId - ID of the product
 * @param imageUrls - Array of image URLs
 * @returns Promise with a boolean indicating success
 */
export const updateProductImages = async (productId: string, imageUrls: string[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ imagens: imageUrls, status: 'pendente' })
      .eq('id', productId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating product images:', error);
    toast.error('Erro ao atualizar imagens do produto');
    return false;
  }
};

/**
 * Get product images from the product_images table
 * @param productId - ID of the product
 * @returns Promise with array of product images
 */
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

/**
 * Update an existing product image
 * @param imageId - ID of the image
 * @param updates - Object with updates
 * @returns Promise with a boolean indicating success
 */
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

/**
 * Delete a product image
 * @param imageId - ID of the image to delete
 * @returns Promise with a boolean indicating success
 */
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

/**
 * Delete a product image from storage
 * @param productId - ID of the product
 * @param vendorId - ID of the vendor
 * @param fileName - Name of the file to delete
 * @returns Promise with a boolean indicating success
 */
export const deleteProductImageFromStorage = async (
  productId: string, 
  vendorId: string, 
  fileName: string
): Promise<boolean> => {
  try {
    const filePath = `products/${vendorId}/${productId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('vendor-images')
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting product image from storage:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProductImageFromStorage:', error);
    return false;
  }
};
