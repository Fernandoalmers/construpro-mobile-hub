
import { supabase } from '@/integrations/supabase/client';
import { StoreLocationInfo } from './types';
import { logWithTimestamp } from './logger';

export async function getStoreLocationInfo(storeId?: string, vendorId?: string): Promise<StoreLocationInfo | null> {
  logWithTimestamp('[getStoreLocationInfo] Looking up store location for:', { storeId, vendorId });
  
  try {
    // Tentar buscar pela loja primeiro
    if (storeId) {
      logWithTimestamp('[getStoreLocationInfo] Trying to fetch store by ID:', storeId);
      const { data, error } = await supabase
        .from('stores')
        .select('endereco')
        .eq('id', storeId)
        .single();
      
      logWithTimestamp('[getStoreLocationInfo] Store query result:', { data, error });
      
      if (data?.endereco) {
        // Tratar endereco como objeto JSON
        const endereco = data.endereco as any;
        logWithTimestamp('[getStoreLocationInfo] Found store address:', endereco);
        return {
          cep: endereco?.cep,
          ibge: endereco?.ibge,
        };
      }
    }

    // Se não encontrou pela loja, buscar pelo vendedor
    if (vendorId) {
      logWithTimestamp('[getStoreLocationInfo] Trying to fetch vendor by ID:', vendorId);
      const { data, error } = await supabase
        .from('vendedores')
        .select('endereco_cep, zona_entrega')
        .eq('id', vendorId)
        .single();

      logWithTimestamp('[getStoreLocationInfo] Vendor query result:', { data, error });

      if (data) {
        // Buscar IBGE do CEP se disponível
        let ibge = null;
        if (data.endereco_cep) {
          logWithTimestamp('[getStoreLocationInfo] Looking up IBGE for vendor CEP:', data.endereco_cep);
          try {
            const { data: cepData, error: cepError } = await supabase
              .from('zip_cache')
              .select('ibge')
              .eq('cep', data.endereco_cep)
              .single();
            
            logWithTimestamp('[getStoreLocationInfo] CEP lookup result:', { cepData, cepError });
            ibge = cepData?.ibge;
          } catch (cepError) {
            logWithTimestamp('[getStoreLocationInfo] Error looking up IBGE:', cepError);
          }
        }

        const result = {
          cep: data.endereco_cep,
          ibge: ibge,
          zona: data.zona_entrega,
        };
        logWithTimestamp('[getStoreLocationInfo] Returning vendor info:', result);
        return result;
      }
    }

    logWithTimestamp('[getStoreLocationInfo] No store or vendor info found');
    return null;
  } catch (error) {
    logWithTimestamp('[getStoreLocationInfo] Error looking up store info:', error);
    return null;
  }
}
