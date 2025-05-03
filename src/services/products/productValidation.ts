
import { VendorProduct } from './productBase';
import { getProductImages } from './images';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate required product fields
 * @param product - The product to validate
 * @returns Array of validation errors, empty if valid
 */
export const validateRequiredFields = (product: Partial<VendorProduct>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!product.nome?.trim()) {
    errors.push({
      field: 'nome',
      message: 'Nome do produto é obrigatório'
    });
  }
  
  if (!product.descricao?.trim()) {
    errors.push({
      field: 'descricao',
      message: 'Descrição do produto é obrigatória'
    });
  }
  
  if (!product.categoria) {
    errors.push({
      field: 'categoria',
      message: 'Categoria do produto é obrigatória'
    });
  }
  
  if (product.preco_normal === undefined || product.preco_normal <= 0) {
    errors.push({
      field: 'preco_normal',
      message: 'Preço deve ser maior que zero'
    });
  }
  
  return errors;
};

/**
 * Validate price fields
 * @param product - The product to validate
 * @returns Array of validation errors, empty if valid
 */
export const validatePriceFields = (product: Partial<VendorProduct>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Only validate promotional price if it's filled in
  if (product.preco_promocional !== undefined && 
      product.preco_promocional !== null && 
      product.preco_promocional > 0 && 
      product.preco_normal !== undefined && 
      product.preco_promocional >= product.preco_normal) {
    errors.push({
      field: 'preco_promocional',
      message: 'Preço promocional deve ser menor que o preço regular'
    });
  }
  
  return errors;
};

/**
 * Check if product has images
 * @param productId - ID of the product
 * @returns Promise with a boolean indicating if product has images
 */
export const checkProductHasImages = async (productId: string): Promise<boolean> => {
  try {
    // First check in product_images table
    const images = await getProductImages(productId);
    
    if (images && images.length > 0) {
      return true;
    }
    
    // Also check the imagens array in produtos table
    const { data, error } = await supabase
      .from('produtos')
      .select('imagens')
      .eq('id', productId)
      .single();
      
    if (error) throw error;
    
    return data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0;
  } catch (error) {
    console.error('Error checking product images:', error);
    return false;
  }
};

/**
 * Verify product stock availability
 * @param productId - ID of the product 
 * @param quantityRequested - Quantity requested
 * @returns Promise with a boolean indicating if stock is available
 */
export const verifyStockAvailability = async (
  productId: string, 
  quantityRequested: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('estoque')
      .eq('id', productId)
      .single();
      
    if (error) throw error;
    
    return data.estoque >= quantityRequested;
  } catch (error) {
    console.error('Error verifying stock availability:', error);
    return false;
  }
};

/**
 * Perform full product validation
 * @param product - The product to validate
 * @returns Object with isValid flag and array of errors
 */
export const validateProduct = (product: Partial<VendorProduct>): { isValid: boolean; errors: ValidationError[] } => {
  // Run all validation functions
  const requiredFieldErrors = validateRequiredFields(product);
  const priceErrors = validatePriceFields(product);
  
  // Combine all errors
  const allErrors = [...requiredFieldErrors, ...priceErrors];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};
