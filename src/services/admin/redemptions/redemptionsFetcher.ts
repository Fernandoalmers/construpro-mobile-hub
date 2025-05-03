
import { supabase } from '@/integrations/supabase/client';
import { AdminRedemption } from '@/types/admin';
import { toast } from '@/components/ui/sonner';

// Cache for redemptions to improve performance
let redemptionsCache: AdminRedemption[] = [];

/**
 * Update a redemption status in the cache
 */
export const updateRedemptionInCache = (
  redemptionId: string, 
  newStatus: "pendente" | "aprovado" | "recusado" | "entregue"
): void => {
  redemptionsCache = redemptionsCache.map(redemption =>
    redemption.id === redemptionId
      ? { ...redemption, status: newStatus }
      : redemption
  );
};

/**
 * Fetch redemptions with optional filtering by status
 */
export const fetchRedemptions = async (showAll: boolean = true): Promise<AdminRedemption[]> => {
  try {
    // Build base query
    let query = supabase
      .from('resgates')
      .select(`
        id,
        cliente_id,
        item,
        pontos,
        imagem_url,
        codigo,
        status,
        data,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
      
    // If not showing all, filter to only pending ones
    if (!showAll) {
      query = query.eq('status', 'pendente');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching redemptions:', error);
      throw error;
    }
    
    // Get customer info for each redemption
    const redemptionsWithCustomerInfo = await Promise.all((data || []).map(async (redemption) => {
      // Get customer info
      const { data: customerData } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('id', redemption.cliente_id)
        .single();
      
      return {
        ...redemption,
        cliente_nome: customerData?.nome || 'Desconhecido',
        cliente_email: customerData?.email,
        // Ensure the status is properly typed
        status: redemption.status as "pendente" | "aprovado" | "recusado" | "entregue"
      } as AdminRedemption;
    }));
    
    // Update the cache
    redemptionsCache = redemptionsWithCustomerInfo;
    
    return redemptionsWithCustomerInfo;
  } catch (error) {
    console.error('Error in fetchRedemptions:', error);
    toast.error('Erro ao carregar resgates');
    return [];
  }
};

/**
 * Get redemptions count by status
 */
export const getRedemptionsCount = async (): Promise<{ total: number; pending: number }> => {
  try {
    // Get pending count
    const pendingRedemptions = await fetchRedemptions(false);
    
    // Get total count
    const { count, error } = await supabase
      .from('resgates')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error getting redemptions count:', error);
      throw error;
    }
    
    return {
      total: count || 0,
      pending: pendingRedemptions.length
    };
  } catch (error) {
    console.error('Error in getRedemptionsCount:', error);
    return { total: 0, pending: 0 };
  }
};
