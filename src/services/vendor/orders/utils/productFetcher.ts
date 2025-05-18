
import { supabase } from '@/integrations/supabase/client';
import { ProductData, ProductImageType, RawProductData } from './productTypes';

// Helper to get vendor product IDs with improved error handling
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    console.log('Getting product IDs for vendor:', vendorId);
    
    // Check if vendorId is valid
    if (!vendorId) {
      console.error('Invalid vendor ID provided');
      return [];
    }
    
    // Get all produtos owned by this vendor
    const result = await supabase
      .from('produtos')
      .select('id, nome, status')
      .eq('vendedor_id', vendorId);
      
    // Handle error explicitly  
    if (result.error) {
      console.error('Error fetching vendor products:', result.error);
      return [];
    }
    
    // Use explicit array type to prevent deep instantiation
    const products = result.data as Array<{ id: string; nome: string; status: string }> || [];
    
    if (products.length === 0) {
      console.log('No products found in produtos table, checking alternative table');
      
      // Try alternate product table as backup - using explicit query
      const { data: alternateData, error: alternateError } = await supabase
        .from('products')
        .select('id, nome, status')
        .eq('loja_id', vendorId); // Use loja_id instead of vendedor_id
      
      // Handle error explicitly
      if (alternateError) {
        console.error('Error fetching products:', alternateError);
        return [];
      }
      
      // Use simple array type to prevent deep instantiation
      const alternateProducts = alternateData as Array<{ id: string; nome: string; status: string }> || [];
      
      if (alternateProducts.length === 0) {
        console.log('No products found in alternate table either');
        return [];
      }
      
      // Extract product IDs with clear typing
      const productIds = alternateProducts.map(item => item.id);
      console.log(`Found ${productIds.length} products in alternate table`);
      console.log('Product sample:', alternateProducts[0]);
      return productIds;
    }
    
    // Log product information for debugging
    console.log(`Found ${products.length} products for this vendor`);
    console.log('Products sample:', products.slice(0, 2));
    
    // Filter to only include approved products for orders
    const approvedProducts = products.filter(p => p.status === 'aprovado');
    console.log(`Of which ${approvedProducts.length} are approved`);
    
    return approvedProducts.map(p => p.id);
  } catch (error) {
    console.error('Unexpected error in getVendorProductIds:', error);
    return [];
  }
};

// Fetch product data with explicit typing
export const fetchProductsForItems = async (productIds: string[]): Promise<Record<string, ProductData>> => {
  if (!productIds.length) return {};
  
  try {
    console.log(`Fetching product data for ${productIds.length} products`);
    
    // Use IN filter to get only the requested products
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, descricao, preco_normal, imagens')
      .in('id', productIds);
    
    if (error) {
      console.error('Error fetching products:', error);
      return {};
    }
    
    // Use explicit type assertion to prevent deep instantiation
    const produtos = data as RawProductData[] || [];
    
    if (produtos.length === 0) {
      console.log('No products found matching the requested IDs');
      return {};
    }
    
    console.log(`Found ${produtos.length} products out of ${productIds.length} requested`);
    
    const productMap: Record<string, ProductData> = {};
    
    produtos.forEach(product => {
      productMap[product.id] = {
        id: product.id,
        nome: product.nome || '',
        descricao: product.descricao,
        preco_normal: product.preco_normal || 0,
        imagens: processImagens(product.imagens)
      };
    });
    
    return productMap;
  } catch (error) {
    console.error('Error fetching products for items:', error);
    return {};
  }
};

// Simplified image processing function
export function processImagens(rawImagens: unknown): ProductImageType {
  if (!rawImagens) return null;
  
  // For string input
  if (typeof rawImagens === 'string') {
    return [rawImagens];
  }
  
  // For array input
  if (Array.isArray(rawImagens)) {
    const result: string[] = [];
    
    for (const img of rawImagens) {
      if (typeof img === 'string') {
        result.push(img);
      } else if (typeof img === 'object' && img !== null && 'url' in img) {
        // Extract the URL string from an object with url property
        const urlValue = (img as { url: string }).url;
        if (typeof urlValue === 'string') {
          result.push(urlValue);
        }
      }
    }
    
    return result.length > 0 ? result : null;
  }
  
  return null;
}
