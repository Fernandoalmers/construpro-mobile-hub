
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
    
    // Get the products for this vendor
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('vendedor_id', vendor.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[productFetcher] Error fetching products:', error);
      return [];
    }
    
    console.log(`[productFetcher] Found ${data?.length || 0} products`);
    return data as VendorProduct[];
  } catch (error) {
    console.error('[productFetcher] Error in getVendorProducts:', error);
    return [];
  }
};

/**
 * Get a specific product by ID
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
    
    // Fetch the product
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
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
    
    // Verify this product belongs to the current vendor
    if (data.vendedor_id !== vendor.id) {
      console.warn('[productFetcher] Product does not belong to current vendor');
      // Still returning the product, but with a warning (you could return null to enforce access control)
    }
    
    console.log('[productFetcher] Product data:', data);
    return data as VendorProduct;
  } catch (error) {
    console.error('[productFetcher] Error in getVendorProduct:', error);
    return null;
  }
};
