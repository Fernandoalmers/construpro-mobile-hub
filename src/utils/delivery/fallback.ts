
import { supabase } from '@/integrations/supabase/client';
import { DeliveryInfo } from './types';
import { logWithTimestamp } from './logger';

/**
 * Lógica de fallback quando não há zonas configuradas
 */
export async function fallbackDeliveryInfo(
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
