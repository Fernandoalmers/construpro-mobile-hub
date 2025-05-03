
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ProductImage } from './productImageTypes';

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
