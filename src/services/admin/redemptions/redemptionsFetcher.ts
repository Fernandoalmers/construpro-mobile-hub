
import { supabase } from '@/integrations/supabase/client';
import { AdminRedemption, RedemptionsCache, CACHE_DURATION } from './types';

// Cache to prevent unnecessary refetches
let redemptionsCache: RedemptionsCache = {
  data: null,
  timestamp: 0
};

/**
 * Fetches all redemptions from the system
 */
export const fetchRedemptions = async (forceRefresh = false): Promise<AdminRedemption[]> => {
  // Return cached data if available and not expired
  const now = Date.now();
  if (!forceRefresh && redemptionsCache.data && (now - redemptionsCache.timestamp < CACHE_DURATION)) {
    return redemptionsCache.data;
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
    redemptionsCache = {
      data: formattedData,
      timestamp: now
    };

    return formattedData;
  } catch (error) {
    console.error('Unexpected error fetching redemptions:', error);
    return [];
  }
};

/**
 * Updates the cache with a single updated redemption
 */
export const updateRedemptionInCache = (
  redemptionId: string, 
  newStatus: "recusado" | "pendente" | "aprovado" | "entregue"
): void => {
  if (redemptionsCache.data) {
    redemptionsCache.data = redemptionsCache.data.map(item => 
      item.id === redemptionId 
        ? { ...item, status: newStatus, updated_at: new Date().toISOString() } 
        : item
    );
  }
};

/**
 * Invalidates the cache completely
 */
export const invalidateRedemptionsCache = (): void => {
  redemptionsCache = {
    data: null,
    timestamp: 0
  };
};
