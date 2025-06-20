
import { supabase } from '@/integrations/supabase/client';
import { DeliveryInfo } from './types';
import { logWithTimestamp, withTimeout, withRetry } from './logger';
import { checkCepInZone } from './cepValidation';

/**
 * Verifica as zonas de entrega configuradas pelo vendedor com logs super detalhados
 */
export async function getVendorDeliveryInfo(
  vendorId: string,
  customerCep?: string
): Promise<DeliveryInfo> {
  const startTime = Date.now();
  logWithTimestamp('[getVendorDeliveryInfo] 🚀 STARTING VENDOR DELIVERY CHECK:', {
    vendorId,
    customerCep,
    timestamp: new Date().toISOString()
  });

  if (!customerCep) {
    logWithTimestamp('[getVendorDeliveryInfo] ❌ NO CUSTOMER CEP PROVIDED');
    return {
      isLocal: false,
      message: 'Informe seu CEP para calcular o frete',
    };
  }

  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  logWithTimestamp('[getVendorDeliveryInfo] 🧹 CLEANED CUSTOMER CEP:', {
    original: customerCep,
    cleaned: cleanCustomerCep,
    length: cleanCustomerCep.length
  });

  try {
    // Buscar zonas de entrega com logs detalhados
    logWithTimestamp('[getVendorDeliveryInfo] 🔍 FETCHING VENDOR DELIVERY ZONES...');
    
    const deliveryZones = await withRetry(async () => {
      const queryPromise = Promise.resolve(
        supabase
          .from('vendor_delivery_zones')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('active', true)
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          })
      );
      
      return await withTimeout(
        queryPromise,
        8000,
        'Vendor delivery zones fetch'
      );
    }, 2, 1000, 'vendor delivery zones fetch');

    const fetchElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] ✅ DELIVERY ZONES FETCHED in ${fetchElapsed}ms:`, { 
      zonesCount: deliveryZones.length,
      zones: deliveryZones.map(z => ({
        id: z.id,
        name: z.zone_name,
        type: z.zone_type,
        value: z.zone_value,
        fee: z.delivery_fee,
        time: z.delivery_time,
        active: z.active
      }))
    });

    if (deliveryZones.length === 0) {
      logWithTimestamp('[getVendorDeliveryInfo] ❌ NO DELIVERY ZONES CONFIGURED');
      return {
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
      };
    }

    logWithTimestamp('[getVendorDeliveryInfo] 🎯 STARTING ZONE VALIDATION PROCESS:', {
      totalZones: deliveryZones.length,
      customerCep: cleanCustomerCep
    });

    // Verificar cada zona configurada
    for (let i = 0; i < deliveryZones.length; i++) {
      const zone = deliveryZones[i];
      logWithTimestamp(`[getVendorDeliveryInfo] 🔍 CHECKING ZONE ${i + 1}/${deliveryZones.length}:`, {
        zoneId: zone.id,
        zoneName: zone.zone_name,
        zoneType: zone.zone_type,
        zoneValue: zone.zone_value,
        deliveryFee: zone.delivery_fee,
        deliveryTime: zone.delivery_time,
        customerCep: cleanCustomerCep
      });
      
      try {
        logWithTimestamp(`[getVendorDeliveryInfo] 🚀 CALLING checkCepInZone for "${zone.zone_name}"...`);
        
        const isInZone = await withTimeout(
          checkCepInZone(cleanCustomerCep, zone.zone_type, zone.zone_value),
          6000,
          `Zone check for ${zone.zone_name}`
        );
        
        logWithTimestamp(`[getVendorDeliveryInfo] 🎯 ZONE "${zone.zone_name}" VALIDATION COMPLETE:`, { 
          zoneName: zone.zone_name,
          zoneType: zone.zone_type,
          zoneValue: zone.zone_value,
          customerCep: cleanCustomerCep,
          isInZone,
          elapsedTime: Date.now() - startTime
        });
        
        if (isInZone) {
          logWithTimestamp('[getVendorDeliveryInfo] 🎉 ✅ CUSTOMER IS IN CONFIGURED ZONE - SUCCESS!:', {
            zoneName: zone.zone_name,
            zoneType: zone.zone_type,
            zoneValue: zone.zone_value,
            deliveryFee: zone.delivery_fee,
            deliveryTime: zone.delivery_time,
            customerCep: cleanCustomerCep,
            isLocal: zone.delivery_fee === 0
          });
          
          const result = {
            isLocal: zone.delivery_fee === 0,
            message: zone.delivery_fee === 0 ? 'Entrega local gratuita' : `Entrega: R$ ${zone.delivery_fee.toFixed(2)}`,
            estimatedTime: zone.delivery_time,
            deliveryFee: zone.delivery_fee
          };
          
          const totalElapsed = Date.now() - startTime;
          logWithTimestamp(`[getVendorDeliveryInfo] 🏆 ✅ FINAL SUCCESS RESULT in ${totalElapsed}ms:`, result);
          return result;
        } else {
          logWithTimestamp(`[getVendorDeliveryInfo] ❌ Customer NOT in zone "${zone.zone_name}", continuing to next zone...`);
        }
      } catch (zoneError) {
        logWithTimestamp('[getVendorDeliveryInfo] ⚠️ ZONE CHECK FAILED, continuing to next zone:', { 
          zone: zone.zone_name, 
          error: zoneError?.message || zoneError,
          stack: zoneError?.stack
        });
        continue;
      }
    }

    // Se não está em nenhuma zona configurada
    logWithTimestamp('[getVendorDeliveryInfo] ❌ CUSTOMER NOT IN ANY CONFIGURED ZONE after checking all zones');
    const result = {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
    
    const totalElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] ⏱️ COMPLETED with default message in ${totalElapsed}ms`);
    return result;

  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] 💥 ❌ CRITICAL ERROR after ${elapsed}ms:`, {
      error: error?.message || error,
      stack: error?.stack,
      vendorId,
      customerCep: cleanCustomerCep
    });
    
    return {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
  }
}
