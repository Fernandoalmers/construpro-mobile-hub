
import { supabase } from '@/integrations/supabase/client';
import { VendorProduct, VendorProductInput } from './types';

/**
 * Save a vendor product (create new or update existing)
 */
export const saveVendorProduct = async (productData: VendorProductInput): Promise<VendorProduct | null> => {
  try {
    console.log('[productOperations] Saving product data:', productData);
    
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[productOperations] No authenticated user found');
      return null;
    }
    
    // Get the vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError || !vendor) {
      console.error('[productOperations] Error getting vendor ID:', vendorError);
      return null;
    }
    
    const isUpdate = !!productData.id;
    console.log(`[productOperations] ${isUpdate ? 'Updating' : 'Creating'} product for vendor ID:`, vendor.id);
    
    // Ensure categoria is not undefined before saving
    if (!productData.categoria) {
      productData.categoria = 'Geral'; // Default category if none provided
    }
    
    // Properly handle images array
    let imagensJson = '[]';
    if (productData.imagens && Array.isArray(productData.imagens)) {
      // Filter out empty strings and blob URLs
      const validImages = productData.imagens.filter(img => 
        img && typeof img === 'string' && img.trim() !== '' && !img.startsWith('blob:')
      );
      imagensJson = JSON.stringify(validImages);
      console.log('[productOperations] Processing images:', validImages);
    }
    
    // Prepare data for insert/update
    const dbData = {
      ...productData,
      vendedor_id: vendor.id,
      // When updating, set status to 'pendente' to require re-approval
      status: isUpdate ? 'pendente' as const : 'pendente' as const,
      updated_at: new Date().toISOString(),
      // Ensure imagens is stored as proper JSON string
      imagens: imagensJson
    };
    
    console.log('[productOperations] Database data to save:', {
      ...dbData,
      imagens: `JSON string with ${JSON.parse(imagensJson).length} images`
    });
    
    // Remove id when creating a new product
    if (!isUpdate) {
      delete dbData.id;
    }
    
    // Insert new or update existing product
    let result;
    if (isUpdate) {
      console.log('[productOperations] Updating product with ID:', productData.id);
      result = await supabase
        .from('produtos')
        .update(dbData)
        .eq('id', productData.id)
        .select()
        .single();
    } else {
      console.log('[productOperations] Creating new product');
      result = await supabase
        .from('produtos')
        .insert(dbData)
        .select()
        .single();
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('[productOperations] Error saving product:', error);
      return null;
    }
    
    console.log(`[productOperations] Product ${isUpdate ? 'updated' : 'created'} successfully:`, data);
    
    // Parse images back to array for return
    let returnedImages = [];
    if (data.imagens) {
      try {
        returnedImages = JSON.parse(data.imagens);
      } catch (e) {
        console.warn('[productOperations] Error parsing returned images:', e);
        returnedImages = [];
      }
    }
    
    return {
      ...data,
      imagens: returnedImages
    } as VendorProduct;
    
  } catch (error) {
    console.error('[productOperations] Error in saveVendorProduct:', error);
    return null;
  }
};

/**
 * Delete a vendor product
 */
export const deleteVendorProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log('[productOperations] Deleting product with ID:', productId);
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error('[productOperations] Error deleting product:', error);
      return false;
    }
    
    console.log('[productOperations] Product deleted successfully');
    return true;
  } catch (error) {
    console.error('[productOperations] Error in deleteVendorProduct:', error);
    return false;
  }
};

/**
 * Update a product's status
 */
export const updateProductStatus = async (
  productId: string, 
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo'
): Promise<boolean> => {
  try {
    console.log(`[productOperations] Updating product ${productId} status to: ${status}`);
    
    const { error } = await supabase
      .from('produtos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (error) {
      console.error('[productOperations] Error updating product status:', error);
      return false;
    }
    
    console.log('[productOperations] Product status updated successfully');
    return true;
  } catch (error) {
    console.error('[productOperations] Error in updateProductStatus:', error);
    return false;
  }
};
