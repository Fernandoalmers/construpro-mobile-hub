
import { supabase } from '@/integrations/supabase/client';
import { VendorProduct, VendorProductInput } from './types';

/**
 * Save a vendor product (create new or update existing)
 */
export const saveVendorProduct = async (productData: VendorProductInput): Promise<VendorProduct | null> => {
  try {
    console.log('[productSaver] Saving product data:', productData);
    
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[productSaver] No authenticated user found');
      return null;
    }
    
    // Get the vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError || !vendor) {
      console.error('[productSaver] Error getting vendor ID:', vendorError);
      return null;
    }
    
    const isUpdate = !!productData.id;
    console.log(`[productSaver] ${isUpdate ? 'Updating' : 'Creating'} product for vendor ID:`, vendor.id);
    
    // Ensure categoria is not undefined before saving
    if (!productData.categoria) {
      productData.categoria = 'Geral'; // Default category if none provided
    }
    
    // FIXED: Properly handle images array - save as proper JSON array, not escaped string
    let imagensArray: string[] = [];
    if (productData.imagens && Array.isArray(productData.imagens)) {
      // Filter out empty strings, blob URLs, and invalid URLs
      imagensArray = productData.imagens.filter(img => 
        img && 
        typeof img === 'string' && 
        img.trim() !== '' && 
        !img.startsWith('blob:') &&
        (img.startsWith('http') || img.startsWith('/'))
      );
      
      console.log('[productSaver] Filtered valid images:', imagensArray);
    }
    
    // Validate SKU and barcode uniqueness
    await validateProductUniqueness(productData);
    
    // Prepare data for insert/update
    const dbData = {
      ...productData,
      vendedor_id: vendor.id,
      // When updating, set status to 'pendente' to require re-approval
      status: isUpdate ? 'pendente' as const : 'pendente' as const,
      updated_at: new Date().toISOString(),
      // FIXED: Store as proper JSON array (not escaped string)
      imagens: imagensArray, // Direct array, not stringified
      // Clean and format SKU and barcode
      sku: productData.sku?.trim() || null,
      codigo_barras: productData.codigo_barras?.trim() || null
    };
    
    console.log('[productSaver] Database data to save:', {
      ...dbData,
      imagens: `Array with ${imagensArray.length} images:`,
      imagensArray
    });
    
    // Remove id when creating a new product
    if (!isUpdate) {
      delete dbData.id;
    }
    
    // Insert new or update existing product
    let result;
    if (isUpdate) {
      console.log('[productSaver] Updating product with ID:', productData.id);
      result = await supabase
        .from('produtos')
        .update(dbData)
        .eq('id', productData.id)
        .select()
        .single();
    } else {
      console.log('[productSaver] Creating new product');
      result = await supabase
        .from('produtos')
        .insert(dbData)
        .select()
        .single();
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('[productSaver] Error saving product:', error);
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
    
    console.log(`[productSaver] Product ${isUpdate ? 'updated' : 'created'} successfully:`, data);
    
    // FIXED: Return images as proper array
    let returnedImages = [];
    if (data.imagens) {
      if (Array.isArray(data.imagens)) {
        // Already an array - use as is
        returnedImages = data.imagens;
      } else if (typeof data.imagens === 'string') {
        // If it's a string, try to parse it
        try {
          const parsed = JSON.parse(data.imagens);
          returnedImages = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          console.warn('[productSaver] Error parsing returned images:', e);
          returnedImages = [];
        }
      }
    }
    
    console.log('[productSaver] Final returned images:', returnedImages);
    
    return {
      ...data,
      imagens: returnedImages
    } as VendorProduct;
    
  } catch (error) {
    console.error('[productSaver] Error in saveVendorProduct:', error);
    throw error;
  }
};

/**
 * Validate SKU and barcode uniqueness
 */
const validateProductUniqueness = async (productData: VendorProductInput): Promise<void> => {
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
};
