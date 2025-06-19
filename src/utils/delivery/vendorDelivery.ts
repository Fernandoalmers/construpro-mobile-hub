
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
  logWithTimestamp('[getVendorDeliveryInfo] 🚀 Starting delivery check for vendor:', {
    vendorId,
    customerCep
  });

  if (!customerCep) {
    logWithTimestamp('[getVendorDeliveryInfo] ❌ No customer CEP provided');
    return {
      isLocal: false,
      message: 'Informe seu CEP para calcular o frete',
    };
  }

  const cleanCustomerCep = customerCep.replace(/\D/g, '');
  logWithTimestamp('[getVendorDeliveryInfo] 🧹 Clean customer CEP:', cleanCustomerCep);

  try {
    // Buscar zonas de entrega com timeout aumentado e retry
    logWithTimestamp('[getVendorDeliveryInfo] 🔍 Fetching vendor delivery zones...');
    
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
        8000, // Aumentado de 3s para 8s
        'Vendor delivery zones fetch'
      );
    }, 2, 1000, 'vendor delivery zones fetch');

    const fetchElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] ✅ Delivery zones query completed in ${fetchElapsed}ms:`, { 
      zonesCount: deliveryZones.length,
      zones: deliveryZones.map(z => ({
        name: z.zone_name,
        type: z.zone_type,
        value: z.zone_value,
        fee: z.delivery_fee,
        time: z.delivery_time
      }))
    });

    if (deliveryZones.length === 0) {
      logWithTimestamp('[getVendorDeliveryInfo] ❌ No delivery zones configured, using fallback');
      return {
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
      };
    }

    logWithTimestamp('[getVendorDeliveryInfo] 🎯 Found delivery zones:', deliveryZones.length);

    // Verificar cada zona configurada com timeout individual
    for (let i = 0; i < deliveryZones.length; i++) {
      const zone = deliveryZones[i];
      logWithTimestamp(`[getVendorDeliveryInfo] 🔍 Checking zone ${i + 1}/${deliveryZones.length}:`, {
        zoneName: zone.zone_name,
        zoneType: zone.zone_type,
        zoneValue: zone.zone_value,
        deliveryFee: zone.delivery_fee,
        deliveryTime: zone.delivery_time
      });
      
      try {
        logWithTimestamp(`[getVendorDeliveryInfo] 🚀 Starting zone validation for "${zone.zone_name}"...`);
        
        const isInZone = await withTimeout(
          checkCepInZone(cleanCustomerCep, zone.zone_type, zone.zone_value),
          6000, // Aumentado de 2s para 6s
          `Zone check for ${zone.zone_name}`
        );
        
        logWithTimestamp(`[getVendorDeliveryInfo] 🎯 Zone "${zone.zone_name}" validation result:`, { 
          zoneName: zone.zone_name,
          zoneType: zone.zone_type,
          zoneValue: zone.zone_value,
          customerCep: cleanCustomerCep,
          isInZone,
          elapsedTime: Date.now() - startTime
        });
        
        if (isInZone) {
          logWithTimestamp('[getVendorDeliveryInfo] 🎉 ✅ Customer IS in configured zone:', {
            zoneName: zone.zone_name,
            zoneType: zone.zone_type,
            zoneValue: zone.zone_value,
            deliveryFee: zone.delivery_fee,
            deliveryTime: zone.delivery_time,
            customerCep: cleanCustomerCep
          });
          
          const result = {
            isLocal: zone.delivery_fee === 0,
            message: zone.delivery_fee === 0 ? 'Entrega local gratuita' : `Entrega: R$ ${zone.delivery_fee.toFixed(2)}`,
            estimatedTime: zone.delivery_time,
            deliveryFee: zone.delivery_fee
          };
          
          const totalElapsed = Date.now() - startTime;
          logWithTimestamp(`[getVendorDeliveryInfo] 🏆 ✅ SUCCESS! Completed in ${totalElapsed}ms with result:`, result);
          return result;
        } else {
          logWithTimestamp(`[getVendorDeliveryInfo] ❌ Customer NOT in zone "${zone.zone_name}", continuing to next zone...`);
        }
      } catch (zoneError) {
        logWithTimestamp('[getVendorDeliveryInfo] ⚠️ Zone check failed, continuing to next zone:', { 
          zone: zone.zone_name, 
          error: zoneError?.message || zoneError
        });
        // Continue to next zone instead of failing completely
        continue;
      }
    }

    // Se não está em nenhuma zona configurada
    logWithTimestamp('[getVendorDeliveryInfo] ❌ Customer not in ANY configured zone after checking all zones');
    const result = {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
    
    const totalElapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] ⏱️ Completed with default message in ${totalElapsed}ms`);
    return result;

  } catch (error) {
    const elapsed = Date.now() - startTime;
    logWithTimestamp(`[getVendorDeliveryInfo] 💥 ❌ CRITICAL ERROR after ${elapsed}ms:`, {
      error: error?.message || error,
      vendorId,
      customerCep: cleanCustomerCep
    });
    
    // Fallback melhorado - ainda tenta fornecer informação útil
    return {
      isLocal: false,
      message: 'Frete calculado no checkout',
      estimatedTime: 'Prazo informado após confirmação do pedido',
    };
  }
}
