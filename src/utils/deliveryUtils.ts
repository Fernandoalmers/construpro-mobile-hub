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
 * Helper function to add timestamp to logs
 */
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Timeout wrapper for async operations
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    )
  ]);
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
  const startTime = Date.now();
  logWithTimestamp('[getProductDeliveryInfo] Starting delivery check for product:', {
    vendorId,
    productId,
    customerCep,
    storeCep,
    storeIbge,
    customerIbge
  });

  // Early return if no customer CEP
  if (!customerCep) {
    logWithTimestamp('[getProductDeliveryInfo] No customer CEP provided');
    return {
      productId,
      vendorId,
      isLocal: false,
      message: 'Informe seu CEP para calcular o frete',
      hasRestrictions: false,
      deliveryAvailable: true
    };
  }

  // Check for product-specific restrictions with shorter timeout and better fallback
  let restrictionCheck = null;
  try {
    logWithTimestamp('[getProductDeliveryInfo] Checking product restrictions with timeout...');
    
    // Reduce timeout to 3 seconds to avoid long waits
    restrictionCheck = await withTimeout(
      checkProductDeliveryRestriction(vendorId, productId, customerCep),
      3000
    );

    logWithTimestamp('[getProductDeliveryInfo] Restriction check completed:', restrictionCheck);

    if (restrictionCheck.has_restriction) {
      logWithTimestamp('[getProductDeliveryInfo] Product restriction found:', restrictionCheck);
      
      const result = {
        productId,
        vendorId,
        isLocal: false,
        message: restrictionCheck.restriction_message || 'Restrição de entrega para esta região',
        hasRestrictions: true,
        restrictionType: restrictionCheck.restriction_type,
        deliveryAvailable: restrictionCheck.delivery_available
      };
      
      const elapsed = Date.now() - startTime;
      logWithTimestamp(`[getProductDeliveryInfo] Completed with restrictions in ${elapsed}ms`);
      return result;
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getProductDeliveryInfo] Restriction check failed after ${elapsed}ms:`, error);
    
    // Continue with vendor delivery zones instead of failing
    logWithTimestamp('[getProductDeliveryInfo] Proceeding with vendor delivery zones due to restriction check failure');
  }

  // If no restrictions or restriction check failed, check vendor delivery zones
  logWithTimestamp('[getProductDeliveryInfo] No restrictions found or check failed, checking vendor delivery zones...');
  
  try {
    const deliveryInfo = await withTimeout(
      getVendorDeliveryInfo(vendorId, customerCep),
      3000 // Reduced timeout to 3 seconds
    );
    
    const result = {
      ...deliveryInfo,
      productId,
      vendorId,
      hasRestrictions: false,
      deliveryAvailable: true
    };
    
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getProductDeliveryInfo] Completed successfully in ${elapsed}ms`);
    return result;
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getProductDeliveryInfo] Vendor delivery info failed after ${elapsed}ms:`, error);
    
    // Always provide a valid delivery option instead of showing "not available"
    return {
      productId,
      vendorId,
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
      hasRestrictions: false,
      deliveryAvailable: true
    };
  }
}

/**
 * Verifica as zonas de entrega configuradas pelo vendedor
 */
export async function getVendorDeliveryInfo(
  vendorId: string,
  customerCep?: string
): Promise<DeliveryInfo> {
  const startTime = Date.now();
  logWithTimestamp('[getVendorDeliveryInfo] Checking vendor zones for:', {
    vendorId,
    customerCep
  });

  if (!customerCep) {
    logWithTimestamp('[getVendorDeliveryInfo] No customer CEP provided');
    return {
      isLocal: false,
      message: 'Informe seu CEP para calcular o frete',
    };
  }

  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  logWithTimestamp('[getVendorDeliveryInfo] Clean customer CEP:', cleanCustomerCep);

  try {
    // Buscar zonas de entrega configuradas pelo vendedor
    logWithTimestamp('[getVendorDeliveryInfo] Fetching vendor delivery zones...');
    
    const { data: deliveryZones, error } = await supabase
      .from('vendor_delivery_zones')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('active', true);

    const fetchElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] Delivery zones query completed in ${fetchElapsed}ms:`, { deliveryZones, error });

    if (error) {
      logWithTimestamp('[getVendorDeliveryInfo] Error fetching zones:', error);
      return {
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
      };
    }

    if (!deliveryZones || deliveryZones.length === 0) {
      logWithTimestamp('[getVendorDeliveryInfo] No delivery zones configured, using fallback');
      return {
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
      };
    }

    logWithTimestamp('[getVendorDeliveryInfo] Found delivery zones:', deliveryZones.length);

    // Verificar cada zona configurada
    for (const zone of deliveryZones) {
      logWithTimestamp('[getVendorDeliveryInfo] Checking zone:', zone.zone_name);
      
      try {
        const isInZone = await withTimeout(
          checkCepInZone(cleanCustomerCep, zone.zone_type, zone.zone_value),
          2000 // 2 second timeout per zone check
        );
        
        logWithTimestamp('[getVendorDeliveryInfo] Zone check result:', { zoneName: zone.zone_name, isInZone });
        
        if (isInZone) {
          logWithTimestamp('[getVendorDeliveryInfo] Customer in configured zone:', zone.zone_name);
          
          const result = {
            isLocal: zone.delivery_fee === 0,
            message: zone.delivery_fee === 0 ? 'Entrega local gratuita' : `Entrega: R$ ${zone.delivery_fee.toFixed(2)}`,
            estimatedTime: zone.delivery_time,
            deliveryFee: zone.delivery_fee
          };
          
          const totalElapsed = Date.now() - startTime;
          logWithTimestamp(`[getVendorDeliveryInfo] Completed successfully in ${totalElapsed}ms`);
          return result;
        }
      } catch (zoneError) {
        logWithTimestamp('[getVendorDeliveryInfo] Zone check failed:', { zone: zone.zone_name, error: zoneError });
        // Continue to next zone instead of failing completely
        continue;
      }
    }

    // Se não está em nenhuma zona configurada, ainda assim fornecer uma opção
    logWithTimestamp('[getVendorDeliveryInfo] Customer not in any configured zone');
    const result = {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
    
    const totalElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] Completed with default message in ${totalElapsed}ms`);
    return result;

  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] Error after ${elapsed}ms:`, error);
    return {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
  }
}

/**
 * Verifica se um CEP está dentro de uma zona configurada
 */
async function checkCepInZone(customerCep: string, zoneType: string, zoneValue: string): Promise<boolean> {
  logWithTimestamp('[checkCepInZone] Checking if CEP', customerCep, 'is in zone type', zoneType, 'with value', zoneValue);
  
  switch (zoneType) {
    case 'cep_specific':
      const result = customerCep === zoneValue.replace(/\D/g, '');
      logWithTimestamp('[checkCepInZone] CEP specific check:', result);
      return result;
    
    case 'cep_range':
      const [startCep, endCep] = zoneValue.split('-').map(cep => cep.replace(/\D/g, ''));
      const customerCepNum = parseInt(customerCep);
      const startCepNum = parseInt(startCep);
      const endCepNum = parseInt(endCep);
      const rangeResult = customerCepNum >= startCepNum && customerCepNum <= endCepNum;
      logWithTimestamp('[checkCepInZone] CEP range check:', {
        customerCepNum,
        startCepNum,
        endCepNum,
        result: rangeResult
      });
      return rangeResult;
    
    case 'ibge':
      try {
        logWithTimestamp('[checkCepInZone] Checking IBGE for CEP:', customerCep);
        const { data: cepData, error } = await supabase
          .from('zip_cache')
          .select('ibge')
          .eq('cep', customerCep)
          .single();
        
        logWithTimestamp('[checkCepInZone] IBGE check result:', { cepData, error });
        return cepData?.ibge === zoneValue;
      } catch (error) {
        logWithTimestamp('[checkCepInZone] Error checking IBGE:', error);
        return false;
      }
    
    case 'cidade':
      try {
        logWithTimestamp('[checkCepInZone] Checking city for CEP:', customerCep);
        const { data: cepData, error } = await supabase
          .from('zip_cache')
          .select('localidade')
          .eq('cep', customerCep)
          .single();
        
        logWithTimestamp('[checkCepInZone] City check result:', { cepData, error });
        return cepData?.localidade?.toLowerCase() === zoneValue.toLowerCase();
      } catch (error) {
        logWithTimestamp('[checkCepInZone] Error checking city:', error);
        return false;
      }
    
    default:
      logWithTimestamp('[checkCepInZone] Unknown zone type:', zoneType);
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
  logWithTimestamp('[fallbackDeliveryInfo] Using fallback logic with:', {
    storeCep,
    storeIbge,
    customerCep,
    customerIbge
  });

  // Se não temos informações suficientes, retorna padrão
  if (!storeCep && !storeIbge) {
    logWithTimestamp('[fallbackDeliveryInfo] Insufficient store info, returning default');
    return {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
  }

  // Se temos IBGE de ambos, comparar diretamente
  if (storeIbge && customerIbge) {
    const isLocal = storeIbge === customerIbge;
    logWithTimestamp('[fallbackDeliveryInfo] Comparing IBGE codes:', {
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
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
      };
    }
  }

  // Se temos CEPs, buscar informações de zona de entrega
  if (storeCep && customerCep) {
    try {
      logWithTimestamp('[fallbackDeliveryInfo] Looking up IBGE codes for CEPs');
      
      const [storeZoneResult, customerZoneResult] = await Promise.allSettled([
        supabase.from('zip_cache').select('ibge').eq('cep', storeCep.replace(/\D/g, '')).single(),
        supabase.from('zip_cache').select('ibge').eq('cep', customerCep.replace(/\D/g, '')).single()
      ]);

      logWithTimestamp('[fallbackDeliveryInfo] IBGE lookup results:', {
        storeZoneResult,
        customerZoneResult
      });

      if (storeZoneResult.status === 'fulfilled' && customerZoneResult.status === 'fulfilled') {
        const storeZone = storeZoneResult.value.data;
        const customerZone = customerZoneResult.value.data;
        
        if (storeZone?.ibge && customerZone?.ibge) {
          const isLocal = storeZone.ibge === customerZone.ibge;
          logWithTimestamp('[fallbackDeliveryInfo] IBGE comparison result:', isLocal);
          
          if (isLocal) {
            return {
              isLocal: true,
              message: 'Entrega local',
              estimatedTime: 'até 48h',
            };
          }
        }
      }
    } catch (error) {
      logWithTimestamp('[fallbackDeliveryInfo] Error looking up zones:', error);
    }
  }

  // Default: frete calculado no checkout
  logWithTimestamp('[fallbackDeliveryInfo] Using default frete calculado no checkout');
  return {
    isLocal: false,
    message: 'Frete calculado no checkout',
    estimatedTime: 'Prazo informado após confirmação do pedido',
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

export async function getStoreLocationInfo(storeId?: string, vendorId?: string) {
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
