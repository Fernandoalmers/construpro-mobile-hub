
import { supabase } from '@/integrations/supabase/client';
import { VendorZonesInfo } from './types';
import { logWithTimestamp } from './logger';

/**
 * Get vendor delivery zones info for display (even without customer CEP)
 */
export async function getVendorDeliveryZonesInfo(vendorId: string): Promise<VendorZonesInfo> {
  logWithTimestamp('[getVendorDeliveryZonesInfo] Getting zones info for vendor:', vendorId);
  
  try {
    const { data: deliveryZones, error } = await supabase
      .from('vendor_delivery_zones')
      .select('zone_name, zone_type, zone_value, delivery_fee, delivery_time')
      .eq('vendor_id', vendorId)
      .eq('active', true)
      .order('delivery_fee');

    if (error) {
      logWithTimestamp('[getVendorDeliveryZonesInfo] Error fetching zones:', error);
      return {
        hasZones: false,
        zonesInfo: [],
        message: 'Informações de entrega não disponíveis'
      };
    }

    if (!deliveryZones || deliveryZones.length === 0) {
      return {
        hasZones: false,
        zonesInfo: [],
        message: 'Vendedor não configurou zonas de entrega'
      };
    }

    const zonesInfo = deliveryZones.map(zone => {
      let zoneDescription = '';
      
      switch (zone.zone_type) {
        case 'cep_range':
          const [start, end] = zone.zone_value.split('-');
          zoneDescription = `CEP ${start}-${end}`;
          break;
        case 'cep_specific':
          zoneDescription = `CEP ${zone.zone_value}`;
          break;
        case 'cidade':
          zoneDescription = `${zone.zone_value}`;
          break;
        case 'ibge':
          zoneDescription = `Região ${zone.zone_name}`;
          break;
        default:
          zoneDescription = zone.zone_name;
      }
      
      const feeInfo = zone.delivery_fee === 0 ? 'Entrega gratuita' : `R$ ${zone.delivery_fee.toFixed(2)}`;
      return `${zoneDescription} - ${feeInfo} (${zone.delivery_time})`;
    });

    const message = deliveryZones.length === 1 
      ? `Entrega disponível em: ${zonesInfo[0]}`
      : `Entrega disponível em ${deliveryZones.length} regiões`;

    logWithTimestamp('[getVendorDeliveryZonesInfo] Zones info prepared:', { zonesInfo, message });

    return {
      hasZones: true,
      zonesInfo,
      message
    };

  } catch (error) {
    logWithTimestamp('[getVendorDeliveryZonesInfo] Exception:', error);
    return {
      hasZones: false,
      zonesInfo: [],
      message: 'Erro ao consultar informações de entrega'
    };
  }
}
