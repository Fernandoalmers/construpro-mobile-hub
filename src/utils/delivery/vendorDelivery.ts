
import { supabase } from '@/integrations/supabase/client';
import { DeliveryInfo } from './types';
import { logWithTimestamp, withTimeout } from './logger';
import { checkCepInZone } from './cepValidation';

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
