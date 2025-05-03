
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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
