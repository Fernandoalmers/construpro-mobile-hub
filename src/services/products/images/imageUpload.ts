
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { getVendorProfile } from '../../vendorProfileService';
import { markProductAsPending } from '@/services/admin/products/productApproval';

/**
 * Upload a single image file
 * @param file - The file to upload
 * @returns Promise with the public URL of the uploaded image or null
 */
export const uploadImageFile = async (
  file: File
): Promise<string | null> => {
  try {
    console.log(`[uploadImageFile] Starting upload for file: ${file.name}`);
    
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `products/${vendorProfile.id}/generic/${fileName}`;
    
    console.log(`[uploadImageFile] Uploading to path: ${filePath}`);
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('[uploadImageFile] Storage upload error:', uploadError);
      toast.error('Erro ao fazer upload da imagem: ' + uploadError.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    const publicUrl = publicUrlData.publicUrl;
    console.log(`[uploadImageFile] Generated public URL: ${publicUrl}`);
      
    return publicUrl;
  } catch (error) {
    console.error('[uploadImageFile] Error in uploadImageFile:', error);
    toast.error('Erro ao processar imagem');
    return null;
  }
};

/**
 * Upload a generic product image (renamed to avoid conflicts with vendor-specific function)
 * @param file - The file to upload
 * @returns Promise with the public URL of the uploaded image or null
 */
export const uploadGenericProductImage = async (
  file: File
): Promise<string | null> => {
  try {
    console.log(`[uploadGenericProductImage] Starting upload for file: ${file.name}`);
    
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `products/${vendorProfile.id}/generic/${fileName}`;
    
    console.log(`[uploadGenericProductImage] Uploading to path: ${filePath}`);
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('[uploadGenericProductImage] Storage upload error:', uploadError);
      toast.error('Erro ao fazer upload da imagem: ' + uploadError.message);
      return null;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    const publicUrl = publicUrlData.publicUrl;
    console.log(`[uploadGenericProductImage] Generated public URL: ${publicUrl}`);
      
    return publicUrl;
  } catch (error) {
    console.error('[uploadGenericProductImage] Error in uploadGenericProductImage:', error);
    toast.error('Erro ao processar imagem');
    return null;
  }
};
