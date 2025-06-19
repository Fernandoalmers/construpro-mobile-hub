
import { supabase } from '@/integrations/supabase/client';
import { DeliveryInfo } from './types';
import { logWithTimestamp, withTimeout, withRetry } from './logger';
import { checkCepInZone } from './cepValidation';

/**
 * Verifica as zonas de entrega configuradas pelo vendedor com timeouts aumentados
 */
export async function getVendorDeliveryInfo(
  vendorId: string,
  customerCep?: string
): Promise<DeliveryInfo> {
  const startTime = Date.now();
  logWithTimestamp('[getVendorDeliveryInfo] Starting delivery check for vendor:', {
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
    // Buscar zonas de entrega com timeout aumentado e retry
    logWithTimestamp('[getVendorDeliveryInfo] Fetching vendor delivery zones...');
    
    const deliveryZones = await withRetry(async () => {
      const queryPromise = supabase
        .from('vendor_delivery_zones')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('active', true)
        .then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        });
      
      return await withTimeout(
        queryPromise,
        8000, // Aumentado de 3s para 8s
        'Vendor delivery zones fetch'
      );
    }, 2, 1000, 'vendor delivery zones fetch');

    const fetchElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] Delivery zones query completed in ${fetchElapsed}ms:`, { 
      zonesCount: deliveryZones.length 
    });

    if (deliveryZones.length === 0) {
      logWithTimestamp('[getVendorDeliveryInfo] No delivery zones configured, using fallback');
      return {
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
      };
    }

    logWithTimestamp('[getVendorDeliveryInfo] Found delivery zones:', deliveryZones.length);

    // Verificar cada zona configurada com timeout individual
    for (const zone of deliveryZones) {
      logWithTimestamp('[getVendorDeliveryInfo] Checking zone:', {
        zoneName: zone.zone_name,
        zoneType: zone.zone_type,
        zoneValue: zone.zone_value,
        deliveryFee: zone.delivery_fee
      });
      
      try {
        const isInZone = await withTimeout(
          checkCepInZone(cleanCustomerCep, zone.zone_type, zone.zone_value),
          6000, // Aumentado de 2s para 6s
          `Zone check for ${zone.zone_name}`
        );
        
        logWithTimestamp('[getVendorDeliveryInfo] Zone check result:', { 
          zoneName: zone.zone_name, 
          isInZone,
          elapsedTime: Date.now() - startTime
        });
        
        if (isInZone) {
          logWithTimestamp('[getVendorDeliveryInfo] ✅ Customer in configured zone:', zone.zone_name);
          
          const result = {
            isLocal: zone.delivery_fee === 0,
            message: zone.delivery_fee === 0 ? 'Entrega local gratuita' : `Entrega: R$ ${zone.delivery_fee.toFixed(2)}`,
            estimatedTime: zone.delivery_time,
            deliveryFee: zone.delivery_fee
          };
          
          const totalElapsed = Date.now() - startTime;
          logWithTimestamp(`[getVendorDeliveryInfo] ✅ Completed successfully in ${totalElapsed}ms`, result);
          return result;
        }
      } catch (zoneError) {
        logWithTimestamp('[getVendorDeliveryInfo] ⚠️ Zone check failed, continuing to next zone:', { 
          zone: zone.zone_name, 
          error: zoneError 
        });
        // Continue to next zone instead of failing completely
        continue;
      }
    }

    // Se não está em nenhuma zona configurada
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
    logWithTimestamp(`[getVendorDeliveryInfo] ❌ Error after ${elapsed}ms:`, error);
    
    // Fallback melhorado - ainda tenta fornecer informação útil
    return {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
  }
}
