
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { VendorProduct } from './types';

/**
 * Get all products for a vendor
 */
export const getVendorProducts = async (): Promise<VendorProduct[]> => {
  try {
    console.log('[productFetcher] Getting vendor products');
    
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[productFetcher] No authenticated user found');
      return [];
    }
    
    // Get the vendor profile from vendedores table
    const { data: vendor, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    console.log('[productFetcher] Vendor data:', vendor, 'error:', vendorError);
    
    if (vendorError || !vendor) {
      console.error('[productFetcher] Error getting vendor ID:', vendorError);
      return [];
    }
    
    // Get the products for this vendor - INCLUDING ALL PROMOTION FIELDS
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        promocao_ativa,
        promocao_inicio,
        promocao_fim,
        preco_promocional
      `)
      .eq('vendedor_id', vendor.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[productFetcher] Error fetching products:', error);
      return [];
    }
    
    console.log(`[productFetcher] Found ${data?.length || 0} products with promotion data`);
    return data as VendorProduct[];
  } catch (error) {
    console.error('[productFetcher] Error in getVendorProducts:', error);
    return [];
  }
};

/**
 * Get a specific product by ID - WITH ALL PROMOTION FIELDS
 */
export const getVendorProduct = async (id: string): Promise<VendorProduct | null> => {
  try {
    console.log('[productFetcher] Getting vendor product by ID:', id);
    
    if (!id) {
      console.error('[productFetcher] No product ID provided');
      return null;
    }
    
    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('[productFetcher] No authenticated user found');
      return null;
    }
    
    // Get the vendor profile for access control check
    const { data: vendor, error: vendorError } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.id)
      .single();
    
    if (vendorError || !vendor) {
      console.error('[productFetcher] Error getting vendor ID:', vendorError);
      return null;
    }
    
    // Fetch the product WITH ALL PROMOTION FIELDS
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        *,
        promocao_ativa,
        promocao_inicio,
        promocao_fim,
        preco_promocional
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('[productFetcher] Error fetching product:', error);
      return null;
    }
    
    if (!data) {
      console.error('[productFetcher] No product found with ID:', id);
      return null;
    }
    
    // Log product data for debugging with promotion info
    console.log('[productFetcher] getVendorProduct with promotion data:', {
      id: data.id,
      nome: data.nome,
      promocao_ativa: data.promocao_ativa,
      promocao_inicio: data.promocao_inicio,
      promocao_fim: data.promocao_fim,
      preco_promocional: data.preco_promocional
    });
    
    // Verify this product belongs to the current vendor
    if (data.vendedor_id !== vendor.id) {
      console.warn('[productFetcher] Product does not belong to current vendor');
    }
    
    return data as VendorProduct;
  } catch (error) {
    console.error('[productFetcher] Error in getVendorProduct:', error);
    return null;
  }
};

/**
 * Fetch product details by ID - INCLUDING PROMOTION FIELDS
 */
export const fetchProductDetails = async (productId: string): Promise<any> => {
  try {
    console.log('[productFetcher] Fetching product details for:', productId);
    
    if (!productId) {
      console.error('[productFetcher] No product ID provided to fetchProductDetails');
      return null;
    }
    
    // Fetch the product WITH ALL PROMOTION FIELDS
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id, 
        nome, 
        preco_normal, 
        preco_promocional,
        promocao_ativa,
        promocao_inicio,
        promocao_fim,
        imagens, 
        descricao, 
        categoria, 
        vendedor_id
      `)
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('[productFetcher] Error fetching product details:', error);
      return null;
    }
    
    if (!data) {
      console.error('[productFetcher] No product details found with ID:', productId);
      return null;
    }
    
    // Extract image URL
    let imageUrl = null;
    if (data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0) {
      imageUrl = typeof data.imagens[0] === 'string' ? data.imagens[0] : null;
    }
    
    // Return formatted product details WITH PROMOTION DATA
    return {
      id: data.id,
      nome: data.nome,
      preco: data.preco_normal,
      preco_promocional: data.preco_promocional,
      promocao_ativa: data.promocao_ativa,
      promocao_inicio: data.promocao_inicio,
      promocao_fim: data.promocao_fim,
      imagem_url: imageUrl,
      descricao: data.descricao,
      categoria: data.categoria,
      vendedor_id: data.vendedor_id
    };
    
  } catch (error) {
    console.error('[productFetcher] Error in fetchProductDetails:', error);
    return null;
  }
};
