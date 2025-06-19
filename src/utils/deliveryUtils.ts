import { supabase } from '@/integrations/supabase/client';
import { checkProductDeliveryRestriction } from '@/services/vendor/deliveryZones';

export interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  hasRestrictions?: boolean;
  restrictionType?: string;
  deliveryAvailable?: boolean;
}

export interface ProductDeliveryInfo extends DeliveryInfo {
  productId: string;
  vendorId: string;
}

/**
 * Compara a localização da loja com a do cliente e verifica restrições de produto
 */
export async function getProductDeliveryInfo(
  vendorId: string,
  productId: string,
  customerCep?: string,
  storeCep?: string,
  storeIbge?: string,
  customerIbge?: string
): Promise<ProductDeliveryInfo> {
  console.log('[getProductDeliveryInfo] Checking delivery for product:', {
    vendorId,
    productId,
    customerCep
  });

  // Check for product-specific restrictions first
  if (customerCep && vendorId && productId) {
    try {
      const restrictionCheck = await checkProductDeliveryRestriction(
        vendorId,
        productId,
        customerCep
      );

      if (restrictionCheck.has_restriction) {
        console.log('[getProductDeliveryInfo] Product restriction found:', restrictionCheck);
        
        return {
          productId,
          vendorId,
          isLocal: false,
          message: restrictionCheck.restriction_message || 'Restrição de entrega para esta região',
          hasRestrictions: true,
          restrictionType: restrictionCheck.restriction_type,
          deliveryAvailable: restrictionCheck.delivery_available
        };
      }
    } catch (error) {
      console.error('[getProductDeliveryInfo] Error checking restrictions:', error);
    }
  }

  // If no restrictions, use general delivery logic
  const generalInfo = await getDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
  
  return {
    ...generalInfo,
    productId,
    vendorId,
    hasRestrictions: false,
    deliveryAvailable: true
  };
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
