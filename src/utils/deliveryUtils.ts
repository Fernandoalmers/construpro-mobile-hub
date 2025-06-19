
import { supabase } from '@/integrations/supabase/client';
import { checkProductDeliveryRestriction } from '@/services/vendor/deliveryZones';

export interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  hasRestrictions?: boolean;
  restrictionType?: string;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
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

  // If no restrictions, check vendor delivery zones
  const deliveryInfo = await getVendorDeliveryInfo(vendorId, customerCep, storeCep, storeIbge, customerIbge);
  
  return {
    ...deliveryInfo,
    productId,
    vendorId,
    hasRestrictions: false,
    deliveryAvailable: true
  };
}

/**
 * Verifica as zonas de entrega configuradas pelo vendedor
 */
export async function getVendorDeliveryInfo(
  vendorId: string,
  customerCep?: string,
  storeCep?: string,
  storeIbge?: string,
  customerIbge?: string
): Promise<DeliveryInfo> {
  console.log('[getVendorDeliveryInfo] Checking vendor zones for:', {
    vendorId,
    customerCep
  });

  if (!customerCep) {
    return {
      isLocal: false,
      message: 'Frete a combinar (informado após o fechamento do pedido)',
    };
  }

  const cleanCustomerCep = customerCep.replace(/\D/g, '');

  try {
    // Buscar zonas de entrega configuradas pelo vendedor
    const { data: deliveryZones, error } = await supabase
      .from('vendor_delivery_zones')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('active', true);

    if (error) {
      console.error('[getVendorDeliveryInfo] Error fetching zones:', error);
      return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
    }

    if (!deliveryZones || deliveryZones.length === 0) {
      console.log('[getVendorDeliveryInfo] No delivery zones configured, using fallback');
      return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
    }

    // Verificar cada zona configurada
    for (const zone of deliveryZones) {
      const isInZone = await checkCepInZone(cleanCustomerCep, zone.zone_type, zone.zone_value);
      
      if (isInZone) {
        console.log('[getVendorDeliveryInfo] Customer in configured zone:', zone.zone_name);
        
        return {
          isLocal: zone.delivery_fee === 0,
          message: zone.delivery_fee === 0 ? 'Entrega local gratuita' : `Entrega: R$ ${zone.delivery_fee.toFixed(2)}`,
          estimatedTime: zone.delivery_time,
          deliveryFee: zone.delivery_fee
        };
      }
    }

    // Se não está em nenhuma zona configurada
    console.log('[getVendorDeliveryInfo] Customer not in any configured zone');
    return {
      isLocal: false,
      message: 'Frete a combinar (informado após o fechamento do pedido)',
    };

  } catch (error) {
    console.error('[getVendorDeliveryInfo] Error:', error);
    return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
  }
}

/**
 * Verifica se um CEP está dentro de uma zona configurada
 */
async function checkCepInZone(customerCep: string, zoneType: string, zoneValue: string): Promise<boolean> {
  switch (zoneType) {
    case 'cep_specific':
      return customerCep === zoneValue.replace(/\D/g, '');
    
    case 'cep_range':
      const [startCep, endCep] = zoneValue.split('-').map(cep => cep.replace(/\D/g, ''));
      const customerCepNum = parseInt(customerCep);
      const startCepNum = parseInt(startCep);
      const endCepNum = parseInt(endCep);
      return customerCepNum >= startCepNum && customerCepNum <= endCepNum;
    
    case 'ibge':
      try {
        const { data: cepData } = await supabase
          .from('zip_cache')
          .select('ibge')
          .eq('cep', customerCep)
          .single();
        
        return cepData?.ibge === zoneValue;
      } catch (error) {
        console.error('[checkCepInZone] Error checking IBGE:', error);
        return false;
      }
    
    case 'cidade':
      try {
        const { data: cepData } = await supabase
          .from('zip_cache')
          .select('localidade')
          .eq('cep', customerCep)
          .single();
        
        return cepData?.localidade?.toLowerCase() === zoneValue.toLowerCase();
      } catch (error) {
        console.error('[checkCepInZone] Error checking city:', error);
        return false;
      }
    
    default:
      return false;
  }
}

/**
 * Lógica de fallback quando não há zonas configuradas
 */
async function fallbackDeliveryInfo(
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
 * Compara a localização da loja com a do cliente para determinar o tipo de entrega
 * @deprecated Use getVendorDeliveryInfo instead
 */
export async function getDeliveryInfo(
  storeCep?: string,
  storeIbge?: string,
  customerCep?: string,
  customerIbge?: string
): Promise<DeliveryInfo> {
  console.warn('[getDeliveryInfo] This function is deprecated. Use getVendorDeliveryInfo instead.');
  return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
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
