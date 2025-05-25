
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  nome_loja: string;
  logo_url?: string;
  status: string;
}

/**
 * Fetches approved AND active stores from the database
 */
export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('vendedores')
    .select('id,nome_loja,logo,status')
    .in('status', ['aprovado', 'ativo']) // Accept both approved and active stores
    .order('nome_loja', { ascending: true });

  if (error) {
    console.error('[getStores] erro:', error);
    throw error;
  }
  
  // Map logo to logo_url to match the interface
  const stores = (data || []).map(store => ({
    id: store.id,
    nome_loja: store.nome_loja,
    logo_url: store.logo,
    status: store.status
  }));
  
  console.log('[getStores] data:', stores);
  return stores;
}
