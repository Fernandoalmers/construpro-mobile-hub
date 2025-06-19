
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
  console.log('[getProductDeliveryInfo] Starting delivery check for product:', {
    vendorId,
    productId,
    customerCep,
    storeCep,
    storeIbge,
    customerIbge
  });

  // Check for product-specific restrictions first
  if (customerCep && vendorId && productId) {
    try {
      console.log('[getProductDeliveryInfo] Checking product restrictions...');
      const restrictionCheck = await checkProductDeliveryRestriction(
        vendorId,
        productId,
        customerCep
      );

      console.log('[getProductDeliveryInfo] Restriction check result:', restrictionCheck);

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
  console.log('[getProductDeliveryInfo] No restrictions found, checking vendor delivery zones...');
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
    customerCep,
    storeCep,
    storeIbge,
    customerIbge
  });

  if (!customerCep) {
    console.log('[getVendorDeliveryInfo] No customer CEP provided');
    return {
      isLocal: false,
      message: 'Frete a combinar (informado após o fechamento do pedido)',
    };
  }

  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  console.log('[getVendorDeliveryInfo] Clean customer CEP:', cleanCustomerCep);

  try {
    // Buscar zonas de entrega configuradas pelo vendedor
    console.log('[getVendorDeliveryInfo] Fetching vendor delivery zones...');
    const { data: deliveryZones, error } = await supabase
      .from('vendor_delivery_zones')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('active', true);

    console.log('[getVendorDeliveryInfo] Delivery zones query result:', { deliveryZones, error });

    if (error) {
      console.error('[getVendorDeliveryInfo] Error fetching zones:', error);
      return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
    }

    if (!deliveryZones || deliveryZones.length === 0) {
      console.log('[getVendorDeliveryInfo] No delivery zones configured, using fallback');
      return fallbackDeliveryInfo(storeCep, storeIbge, customerCep, customerIbge);
    }

    console.log('[getVendorDeliveryInfo] Found', deliveryZones.length, 'delivery zones');

    // Verificar cada zona configurada
    for (const zone of deliveryZones) {
      console.log('[getVendorDeliveryInfo] Checking zone:', zone.zone_name, zone);
      const isInZone = await checkCepInZone(cleanCustomerCep, zone.zone_type, zone.zone_value);
      
      console.log('[getVendorDeliveryInfo] Is customer in zone', zone.zone_name, '?', isInZone);
      
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
  console.log('[checkCepInZone] Checking if CEP', customerCep, 'is in zone type', zoneType, 'with value', zoneValue);
  
  switch (zoneType) {
    case 'cep_specific':
      const result = customerCep === zoneValue.replace(/\D/g, '');
      console.log('[checkCepInZone] CEP specific check:', result);
      return result;
    
    case 'cep_range':
      const [startCep, endCep] = zoneValue.split('-').map(cep => cep.replace(/\D/g, ''));
      const customerCepNum = parseInt(customerCep);
      const startCepNum = parseInt(startCep);
      const endCepNum = parseInt(endCep);
      const rangeResult = customerCepNum >= startCepNum && customerCepNum <= endCepNum;
      console.log('[checkCepInZone] CEP range check:', {
        customerCepNum,
        startCepNum,
        endCepNum,
        result: rangeResult
      });
      return rangeResult;
    
    case 'ibge':
      try {
        console.log('[checkCepInZone] Checking IBGE for CEP:', customerCep);
        const { data: cepData, error } = await supabase
          .from('zip_cache')
          .select('ibge')
          .eq('cep', customerCep)
          .single();
        
        console.log('[checkCepInZone] IBGE check result:', { cepData, error });
        return cepData?.ibge === zoneValue;
      } catch (error) {
        console.error('[checkCepInZone] Error checking IBGE:', error);
        return false;
      }
    
    case 'cidade':
      try {
        console.log('[checkCepInZone] Checking city for CEP:', customerCep);
        const { data: cepData, error } = await supabase
          .from('zip_cache')
          .select('localidade')
          .eq('cep', customerCep)
          .single();
        
        console.log('[checkCepInZone] City check result:', { cepData, error });
        return cepData?.localidade?.toLowerCase() === zoneValue.toLowerCase();
      } catch (error) {
        console.error('[checkCepInZone] Error checking city:', error);
        return false;
      }
    
    default:
      console.log('[checkCepInZone] Unknown zone type:', zoneType);
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
  console.log('[fallbackDeliveryInfo] Using fallback logic with:', {
    storeCep,
    storeIbge,
    customerCep,
    customerIbge
  });

  // Se não temos informações suficientes, retorna padrão
  if (!storeCep && !storeIbge) {
    console.log('[fallbackDeliveryInfo] Insufficient store info, returning default');
    return {
      isLocal: false,
      message: 'Frete a combinar (informado após o fechamento do pedido)',
    };
  }

  // Se temos IBGE de ambos, comparar diretamente
  if (storeIbge && customerIbge) {
    const isLocal = storeIbge === customerIbge;
    console.log('[fallbackDeliveryInfo] Comparing IBGE codes:', {
      storeIbge,
      customerIbge,
      isLocal
    });
    
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
      console.log('[fallbackDeliveryInfo] Looking up IBGE codes for CEPs');
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

      console.log('[fallbackDeliveryInfo] IBGE lookup results:', {
        storeZone,
        customerZone
      });

      if (storeZone?.ibge && customerZone?.ibge) {
        const isLocal = storeZone.ibge === customerZone.ibge;
        console.log('[fallbackDeliveryInfo] IBGE comparison result:', isLocal);
        
        if (isLocal) {
          return {
            isLocal: true,
            message: 'Entrega local',
            estimatedTime: 'até 48h',
          };
        }
      }
    } catch (error) {
      console.error('[fallbackDeliveryInfo] Erro ao buscar informações de zona:', error);
    }
  }

  // Default: frete a combinar
  console.log('[fallbackDeliveryInfo] Using default frete a combinar');
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
 * Busca informações da loja do vendedor com fallback melhorado
 */
export async function getStoreLocationInfo(storeId?: string, vendorId?: string) {
  console.log('[getStoreLocationInfo] Looking up store location for:', { storeId, vendorId });
  
  try {
    // Tentar buscar pela loja primeiro
    if (storeId) {
      console.log('[getStoreLocationInfo] Trying to fetch store by ID:', storeId);
      const { data, error } = await supabase
        .from('stores')
        .select('endereco')
        .eq('id', storeId)
        .single();
      
      console.log('[getStoreLocationInfo] Store query result:', { data, error });
      
      if (data?.endereco) {
        // Tratar endereco como objeto JSON
        const endereco = data.endereco as any;
        console.log('[getStoreLocationInfo] Found store address:', endereco);
        return {
          cep: endereco?.cep,
          ibge: endereco?.ibge,
        };
      }
    }

    // Se não encontrou pela loja, buscar pelo vendedor
    if (vendorId) {
      console.log('[getStoreLocationInfo] Trying to fetch vendor by ID:', vendorId);
      const { data, error } = await supabase
        .from('vendedores')
        .select('endereco_cep, zona_entrega')
        .eq('id', vendorId)
        .single();

      console.log('[getStoreLocationInfo] Vendor query result:', { data, error });

      if (data) {
        // Buscar IBGE do CEP se disponível
        let ibge = null;
        if (data.endereco_cep) {
          console.log('[getStoreLocationInfo] Looking up IBGE for vendor CEP:', data.endereco_cep);
          const { data: cepData, error: cepError } = await supabase
            .from('zip_cache')
            .select('ibge')
            .eq('cep', data.endereco_cep)
            .single();
          
          console.log('[getStoreLocationInfo] CEP lookup result:', { cepData, cepError });
          ibge = cepData?.ibge;
        }

        const result = {
          cep: data.endereco_cep,
          ibge: ibge,
          zona: data.zona_entrega,
        };
        console.log('[getStoreLocationInfo] Returning vendor info:', result);
        return result;
      }
    }

    console.log('[getStoreLocationInfo] No store or vendor info found');
    return null;
  } catch (error) {
    console.error('[getStoreLocationInfo] Erro ao buscar informações da loja:', error);
    return null;
  }
}
