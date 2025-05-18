
import { supabase } from '@/integrations/supabase/client';

// Function to get all product IDs for a vendor
export const getVendorProductIds = async (vendorId: string): Promise<string[]> => {
  try {
    console.log(`🔍 [getVendorProductIds] Fetching product IDs for vendor: ${vendorId}`);
    
    const { data: products, error } = await supabase
      .from('produtos')
      .select('id')
      .eq('vendedor_id', vendorId);
      
    if (error) {
      console.error('🚫 [getVendorProductIds] Error fetching vendor products:', error);
      return [];
    }
    
    const productIds = products.map(p => p.id);
    console.log(`✅ [getVendorProductIds] Found ${productIds.length} products for vendor ${vendorId}`);
    if (productIds.length > 0) {
      console.log('📊 [getVendorProductIds] Sample product IDs:', productIds.slice(0, 3));
    } else {
      console.warn('⚠️ [getVendorProductIds] No products found for vendor');
      
      // Additional debug query to check if the vendor exists in produtos table
      const { data: checkVendor, error: checkError } = await supabase
        .from('produtos')
        .select('count')
        .eq('vendedor_id', vendorId);
        
      if (checkError) {
        console.error('🚫 [Debug] Error checking vendor in produtos:', checkError);
      } else {
        console.log(`ℹ️ [Debug] Vendor check result:`, checkVendor);
      }
    }
    
    return productIds;
  } catch (error) {
    console.error('🚫 [getVendorProductIds] Unexpected error:', error);
    return [];
  }
};

// Function to fetch product details for order items
export const fetchProductsForItems = async (productIds: string[]): Promise<Record<string, any>> => {
  if (!productIds.length) return {};
  
  try {
    console.log(`🔍 [fetchProductsForItems] Fetching product details for ${productIds.length} products`);
    
    const { data: products, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_normal, imagens, descricao, categoria')
      .in('id', productIds);
      
    if (error) {
      console.error('🚫 [fetchProductsForItems] Error fetching products:', error);
      return {};
    }
    
    const productMap: Record<string, any> = {};
    products.forEach(product => {
      // Safely extract image URL with better type checking
      let imageUrl = null;
      if (product.imagens && Array.isArray(product.imagens) && product.imagens.length > 0) {
        const firstImage = product.imagens[0];
        // Better handling of different image object formats
        if (typeof firstImage === 'string') {
          imageUrl = firstImage;
        } else if (firstImage && typeof firstImage === 'object') {
          // Check for common URL fields in image objects
          imageUrl = firstImage.url || firstImage.path || firstImage.src || null;
        }
      }
      
      productMap[product.id] = {
        id: product.id,
        nome: product.nome,
        preco: product.preco_normal,
        imagens: product.imagens,
        imagem_url: imageUrl,
        descricao: product.descricao,
        categoria: product.categoria
      };
    });
    
    console.log(`✅ [fetchProductsForItems] Created product map with ${products.length} products`);
    
    // Log a sample product for debugging
    if (products.length > 0) {
      const sampleProductId = products[0].id;
      console.log('📊 [fetchProductsForItems] Sample product:', {
        id: sampleProductId,
        name: productMap[sampleProductId].nome,
        hasImageUrl: !!productMap[sampleProductId].imagem_url,
        imageFormat: products[0].imagens ? 
          (Array.isArray(products[0].imagens) ? 
            (typeof products[0].imagens[0] === 'string' ? 'string' : 'object') 
            : typeof products[0].imagens) 
          : 'none'
      });
    }
    
    return productMap;
  } catch (error) {
    console.error('🚫 [fetchProductsForItems] Unexpected error:', error);
    return {};
  }
};

// Export product types from a central file
export * from './productTypes';
