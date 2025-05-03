
import { supabase } from '@/integrations/supabase/client';
import { VendorProduct } from './productBase';
import { toast } from '@/components/ui/sonner';

/**
 * Mirror product changes for admin review
 * @param productId - ID of the product
 * @param status - New status to set
 * @returns Promise with a boolean indicating success
 */
export const mirrorChangesForAdmin = async (
  productId: string, 
  status: 'pendente'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('produtos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error mirroring product changes for admin:', error);
    return false;
  }
};

/**
 * Sync product with marketplace
 * @param productId - ID of the product to sync
 * @returns Promise with a boolean indicating success
 */
export const syncWithMarketplace = async (productId: string): Promise<boolean> => {
  try {
    // Get the current product data
    const { data: product, error: fetchError } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', productId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // If product is not approved, don't sync
    if (product.status !== 'aprovado') {
      return false;
    }
    
    // Real marketplace sync logic would go here
    // For now, we're just marking it as synchronized
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', productId);
      
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error synchronizing product with marketplace:', error);
    return false;
  }
};

/**
 * Batch sync all approved products to marketplace
 * @returns Promise with number of products synchronized
 */
export const batchSyncApprovedProducts = async (): Promise<number> => {
  try {
    // Get all approved products
    const { data: products, error: fetchError } = await supabase
      .from('produtos')
      .select('id')
      .eq('status', 'aprovado');
      
    if (fetchError) throw fetchError;
    
    let syncCount = 0;
    
    // Sync each product
    for (const product of products) {
      const synced = await syncWithMarketplace(product.id);
      if (synced) syncCount++;
    }
    
    return syncCount;
  } catch (error) {
    console.error('Error in batch syncing products:', error);
    toast.error('Erro ao sincronizar produtos com o marketplace');
    return 0;
  }
};

/**
 * Refresh product data from database
 * @param productId - ID of the product to refresh
 * @returns Promise with the updated product or null
 */
export const refreshProductData = async (productId: string): Promise<VendorProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', productId)
      .single();
      
    if (error) throw error;
    return data as VendorProduct;
  } catch (error) {
    console.error('Error refreshing product data:', error);
    return null;
  }
};
