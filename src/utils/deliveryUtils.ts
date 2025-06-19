
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
}

/**
 * Compara a localização da loja com a do cliente para determinar o tipo de entrega
 */
export async function getDeliveryInfo(
  storeCep?: string,
  storeIbge?: string,
  customerCep?: string,
  customerIbge?: string
): Promise<DeliveryInfo> {
  // Se não temos informações suficientes, retorna padrão
  if (!storeCep && !storeIbge) {
    return {
      isLocal: false,
      message: 'Frete a combinar (informado após o fechamento do pedido)',
    };
  }

  // Se temos IBGE de ambos, comparar diretamente
  if (storeIbge && customerIbge) {
    const isLocal = storeIbge === customerIbge;
    
    if (isLocal) {
      return {
        isLocal: true,
        message: 'Entrega local',
        estimatedTime: 'até 48h',
      };
    } else {
      return {
        isLocal: false,
        message: 'Frete a combinar (informado após o fechamento do pedido)',
      };
    }
  }

  // Se temos CEPs, buscar informações de zona de entrega
  if (storeCep && customerCep) {
    try {
      const { data: storeZone } = await supabase
        .from('zip_cache')
        .select('ibge')
        .eq('cep', storeCep.replace(/\D/g, ''))
        .single();

      const { data: customerZone } = await supabase
        .from('zip_cache')
        .select('ibge')
        .eq('cep', customerCep.replace(/\D/g, ''))
        .single();

      if (storeZone?.ibge && customerZone?.ibge) {
        const isLocal = storeZone.ibge === customerZone.ibge;
        
        if (isLocal) {
          return {
            isLocal: true,
            message: 'Entrega local',
            estimatedTime: 'até 48h',
          };
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações de zona:', error);
    }
  }

  // Default: frete a combinar
  return {
    isLocal: false,
    message: 'Frete a combinar (informado após o fechamento do pedido)',
  };
}

/**
 * Busca informações da loja do vendedor
 */
export async function getStoreLocationInfo(storeId?: string, vendorId?: string) {
  try {
    // Tentar buscar pela loja primeiro
    if (storeId) {
      const { data } = await supabase
        .from('stores')
        .select('endereco')
        .eq('id', storeId)
        .single();
      
      if (data?.endereco) {
        // Tratar endereco como objeto JSON
        const endereco = data.endereco as any;
        return {
          cep: endereco?.cep,
          ibge: endereco?.ibge,
        };
      }
    }

    // Se não encontrou pela loja, buscar pelo vendedor
    if (vendorId) {
      const { data } = await supabase
        .from('vendedores')
        .select('endereco_cep, zona_entrega')
        .eq('id', vendorId)
        .single();

      if (data) {
        // Buscar IBGE do CEP se disponível
        let ibge = null;
        if (data.endereco_cep) {
          const { data: cepData } = await supabase
            .from('zip_cache')
            .select('ibge')
            .eq('cep', data.endereco_cep)
            .single();
          
          ibge = cepData?.ibge;
        }

        return {
          cep: data.endereco_cep,
          ibge: ibge,
          zona: data.zona_entrega,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar informações da loja:', error);
    return null;
  }
}
