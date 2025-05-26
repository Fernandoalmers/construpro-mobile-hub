
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '../../vendorProfileService';
import { markProductAsPending } from '@/services/admin/products/productApproval';

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
    console.log(`[uploadProductImage] Starting upload for product ${productId}, file: ${file.name}, index: ${index}`);
    
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const fileName = `${Date.now()}-${index}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `products/${vendorProfile.id}/${productId}/${fileName}`;
    
    console.log(`[uploadProductImage] Uploading to path: ${filePath}`);
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('[uploadProductImage] Storage upload error:', uploadError);
      toast.error('Erro ao fazer upload da imagem: ' + uploadError.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    const publicUrl = publicUrlData.publicUrl;
    console.log(`[uploadProductImage] Generated public URL: ${publicUrl}`);
    
    // Save image in product_images table
    const { error: imageError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrl,
        is_primary: index === 0,
        ordem: index
      });
      
    if (imageError) {
      console.error('[uploadProductImage] Error saving product image reference:', imageError);
      // Don't fail the upload if we can't save the reference
    } else {
      console.log(`[uploadProductImage] Successfully saved image reference for ${publicUrl}`);
    }

    // Mark product as pending after image upload
    try {
      await markProductAsPending(productId);
      console.log(`[uploadProductImage] Product ${productId} marked as pending`);
    } catch (pendingError) {
      console.error('[uploadProductImage] Error marking product as pending:', pendingError);
      // Don't fail the upload if we can't mark as pending
    }
      
    return publicUrl;
  } catch (error) {
    console.error('[uploadProductImage] Error in uploadProductImage:', error);
    toast.error('Erro ao processar imagem');
    return null;
  }
};
