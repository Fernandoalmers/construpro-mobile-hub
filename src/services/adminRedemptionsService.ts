
import { supabase } from '@/integrations/supabase/client';

// Define and export the type
export type AdminRedemption = {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  item: string;
  pontos: number;
  imagem_url: string | null;
  codigo: string | null;
  status: "recusado" | "pendente" | "aprovado" | "entregue";
  data: string;
  created_at: string;
  updated_at: string;
};

// Cache to prevent unnecessary refetches
let redemptionsCache: AdminRedemption[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetches all redemptions from the system
 */
export const fetchRedemptions = async (forceRefresh = false): Promise<AdminRedemption[]> => {
  // Return cached data if available and not expired
  const now = Date.now();
  if (!forceRefresh && redemptionsCache && (now - lastFetchTime < CACHE_DURATION)) {
    return redemptionsCache;
  }

  try {
    const { data, error } = await supabase
      .from('resgates')
      .select(`
        *,
        profiles:cliente_id(nome)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching redemptions:', error);
      return [];
    }

    // Guard against null data
    if (!data || !Array.isArray(data)) {
      return [];
    }

    const formattedData = data.map(item => ({
      id: item.id,
      cliente_id: item.cliente_id,
      // Safe access to profiles data with proper type checking
      cliente_nome: item.profiles && typeof item.profiles === 'object' 
        ? ((item.profiles as {nome?: string}).nome || 'Cliente')
        : 'Cliente',
      item: item.item,
      pontos: item.pontos,
      imagem_url: item.imagem_url,
      codigo: item.codigo,
      status: (item.status as "recusado" | "pendente" | "aprovado" | "entregue") || "pendente",
      data: item.data || item.created_at,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    // Update cache
    redemptionsCache = formattedData;
    lastFetchTime = now;

    return formattedData;
  } catch (error) {
    console.error('Unexpected error fetching redemptions:', error);
    return [];
  }
};

/**
 * Approve a redemption
 */
export const approveRedemption = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error approving redemption:', error);
      return false;
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action: 'approve_redemption',
      entity_type: 'redemption',
      entity_id: redemptionId
    });

    // Update the cache instead of invalidating it completely
    if (redemptionsCache) {
      redemptionsCache = redemptionsCache.map(item => 
        item.id === redemptionId 
          ? { ...item, status: 'aprovado', updated_at: new Date().toISOString() } 
          : item
      );
    }

    return true;
  } catch (error) {
    console.error('Unexpected error approving redemption:', error);
    return false;
  }
};

/**
 * Reject a redemption
 */
export const rejectRedemption = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'recusado', updated_at: new Date().toISOString() })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error rejecting redemption:', error);
      return false;
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action: 'reject_redemption',
      entity_type: 'redemption',
      entity_id: redemptionId
    });

    // Update the cache instead of invalidating it completely
    if (redemptionsCache) {
      redemptionsCache = redemptionsCache.map(item => 
        item.id === redemptionId 
          ? { ...item, status: 'recusado', updated_at: new Date().toISOString() } 
          : item
      );
    }

    return true;
  } catch (error) {
    console.error('Unexpected error rejecting redemption:', error);
    return false;
  }
};

/**
 * Mark a redemption as delivered
 */
export const markRedemptionAsDelivered = async (redemptionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('resgates')
      .update({ status: 'entregue', updated_at: new Date().toISOString() })
      .eq('id', redemptionId);

    if (error) {
      console.error('Error marking redemption as delivered:', error);
      return false;
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action: 'deliver_redemption',
      entity_type: 'redemption',
      entity_id: redemptionId
    });

    // Update the cache instead of invalidating it completely
    if (redemptionsCache) {
      redemptionsCache = redemptionsCache.map(item => 
        item.id === redemptionId 
          ? { ...item, status: 'entregue', updated_at: new Date().toISOString() } 
          : item
      );
    }

    return true;
  } catch (error) {
    console.error('Unexpected error marking redemption as delivered:', error);
    return false;
  }
};

/**
 * Get badge color for redemption status
 */
export const getRedemptionStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-amber-100 text-amber-800';
    case 'recusado':
      return 'bg-red-100 text-red-800';
    case 'entregue':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
