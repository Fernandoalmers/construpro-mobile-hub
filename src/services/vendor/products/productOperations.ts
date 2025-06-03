
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
    
    // Properly handle images array - FIXED: avoid double array
    let imagensJson = '[]';
    if (productData.imagens && Array.isArray(productData.imagens)) {
      // Filter out empty strings and blob URLs
      const validImages = productData.imagens.filter(img => 
        img && typeof img === 'string' && img.trim() !== '' && !img.startsWith('blob:')
      );
      
      console.log('[productOperations] Valid images before JSON.stringify:', validImages);
      
      // FIXED: Save as simple array, not double array
      imagensJson = JSON.stringify(validImages);
      
      console.log('[productOperations] Images JSON string:', imagensJson);
    }
    
    // Validate SKU uniqueness if provided
    if (productData.sku && productData.sku.trim()) {
      const { data: existingSku, error: skuError } = await supabase
        .from('produtos')
        .select('id')
        .eq('sku', productData.sku.trim())
        .neq('id', productData.id || '00000000-0000-0000-0000-000000000000')
        .single();
      
      if (existingSku && !skuError) {
        throw new Error('SKU já existe no sistema. Escolha um SKU único.');
      }
    }
    
    // Validate barcode uniqueness if provided
    if (productData.codigo_barras && productData.codigo_barras.trim()) {
      const { data: existingBarcode, error: barcodeError } = await supabase
        .from('produtos')
        .select('id')
        .eq('codigo_barras', productData.codigo_barras.trim())
        .neq('id', productData.id || '00000000-0000-0000-0000-000000000000')
        .single();
      
      if (existingBarcode && !barcodeError) {
        throw new Error('Código de barras já existe no sistema. Escolha um código único.');
      }
    }
    
    // Prepare data for insert/update
    const dbData = {
      ...productData,
      vendedor_id: vendor.id,
      // When updating, set status to 'pendente' to require re-approval
      status: isUpdate ? 'pendente' as const : 'pendente' as const,
      updated_at: new Date().toISOString(),
      // Ensure imagens is stored as proper JSON string (simple array)
      imagens: imagensJson,
      // Clean and format SKU and barcode
      sku: productData.sku?.trim() || null,
      codigo_barras: productData.codigo_barras?.trim() || null
    };
    
    console.log('[productOperations] Database data to save:', {
      ...dbData,
      imagens: `JSON string: ${imagensJson}`
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
      // Handle specific database errors
      if (error.code === '23505') {
        if (error.message.includes('sku')) {
          throw new Error('SKU já existe no sistema. Escolha um SKU único.');
        }
        if (error.message.includes('codigo_barras')) {
          throw new Error('Código de barras já existe no sistema. Escolha um código único.');
        }
      }
      throw error;
    }
    
    console.log(`[productOperations] Product ${isUpdate ? 'updated' : 'created'} successfully:`, data);
    
    // Parse images back to array for return - FIXED: handle both simple and double arrays
    let returnedImages = [];
    if (data.imagens) {
      try {
        const parsed = JSON.parse(data.imagens);
        console.log('[productOperations] Parsed images from DB:', parsed);
        
        // Handle both simple array ["url"] and double array [["url"]]
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && Array.isArray(parsed[0])) {
            // Double array format [["url"]] - flatten it
            returnedImages = parsed.flat();
            console.log('[productOperations] Flattened double array to:', returnedImages);
          } else {
            // Simple array format ["url"] - use as is
            returnedImages = parsed;
          }
        }
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
    throw error;
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
