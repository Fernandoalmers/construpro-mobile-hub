
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
