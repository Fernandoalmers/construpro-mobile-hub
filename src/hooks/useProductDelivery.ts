
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDeliveryZones } from './useDeliveryZones';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/services/productService';

interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  loading: boolean;
  deliveryFee?: number;
}

interface VendorDeliveryZone {
  id: string;
  vendor_id: string;
  zone_name: string;
  zone_type: string;
  zone_value: string;
  delivery_time: string;
  delivery_fee: number;
  active: boolean;
}

export const useProductDelivery = (produto: Product) => {
  const { profile, isAuthenticated } = useAuth();
  const { currentCep, resolveZones, hasActiveZones, currentZones } = useDeliveryZones();
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    isLocal: false,
    message: 'Informe seu CEP para calcular o frete',
    loading: false
  });

  // CEP atual do usuário (endereço principal ou temporário)
  const currentUserCep = useMemo(() => {
    return currentCep || profile?.endereco_principal?.cep || null;
  }, [currentCep, profile?.endereco_principal?.cep]);

  // Função para verificar se CEP está em uma zona específica
  const checkCepInZone = (cep: string, zoneType: string, zoneValue: string): boolean => {
    const cleanCep = cep.replace(/\D/g, '');
    
    switch (zoneType) {
      case 'cep_specific':
        return cleanCep === zoneValue.replace(/\D/g, '');
      case 'cep_range':
        const [start, end] = zoneValue.split('-');
        const cleanStart = start.replace(/\D/g, '');
        const cleanEnd = end.replace(/\D/g, '');
        return cleanCep >= cleanStart && cleanCep <= cleanEnd;
      default:
        return false;
    }
  };

  // Buscar zonas de entrega do vendedor e verificar se atende o CEP
  const fetchVendorDeliveryInfo = async (cep: string) => {
    try {
      console.log('[useProductDelivery] Buscando zonas de entrega do vendedor:', produto.vendedor_id);
      
      const { data: vendorZones, error } = await supabase
        .from('vendor_delivery_zones')
        .select('*')
        .eq('vendor_id', produto.vendedor_id)
        .eq('active', true)
        .order('delivery_fee');

      if (error) {
        console.error('[useProductDelivery] Erro ao buscar zonas:', error);
        throw error;
      }

      console.log('[useProductDelivery] Zonas encontradas:', vendorZones?.length || 0);

      if (!vendorZones || vendorZones.length === 0) {
        return {
          isLocal: false,
          message: 'Frete calculado no checkout',
          estimatedTime: 'Prazo informado após confirmação do pedido',
          loading: false
        };
      }

      // Verificar se o CEP está em alguma zona configurada
      for (const zone of vendorZones) {
        console.log('[useProductDelivery] Verificando zona:', {
          zoneName: zone.zone_name,
          zoneType: zone.zone_type,
          zoneValue: zone.zone_value,
          deliveryTime: zone.delivery_time,
          deliveryFee: zone.delivery_fee
        });

        if (checkCepInZone(cep, zone.zone_type, zone.zone_value)) {
          console.log('[useProductDelivery] ✅ CEP encontrado na zona:', zone.zone_name);
          
          const isLocal = zone.delivery_fee === 0;
          const feeText = isLocal ? 'Entrega gratuita' : `Frete: R$ ${zone.delivery_fee.toFixed(2)}`;
          
          return {
            isLocal,
            message: `${feeText}`,
            estimatedTime: zone.delivery_time,
            deliveryFee: zone.delivery_fee,
            loading: false
          };
        }
      }

      // CEP não está em nenhuma zona configurada
      console.log('[useProductDelivery] CEP não encontrado em nenhuma zona configurada');
      return {
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
        loading: false
      };

    } catch (error) {
      console.error('[useProductDelivery] Erro ao verificar entrega:', error);
      return {
        isLocal: false,
        message: 'Erro ao verificar entrega',
        loading: false
      };
    }
  };

  // Calcular informações de entrega
  const calculateDeliveryInfo = async (forceRecalculate = false) => {
    if (!currentUserCep || (!forceRecalculate && deliveryInfo.loading)) {
      return;
    }

    console.log('[useProductDelivery] Calculando informações de entrega para produto:', produto.id);
    setDeliveryInfo(prev => ({ ...prev, loading: true }));

    try {
      const info = await fetchVendorDeliveryInfo(currentUserCep);
      setDeliveryInfo(info);
    } catch (error) {
      console.error('[useProductDelivery] Erro ao calcular entrega:', error);
      setDeliveryInfo({
        isLocal: false,
        message: 'Erro ao verificar entrega',
        loading: false
      });
    }
  };

  // Recalcular quando CEP ou produto mudar
  useEffect(() => {
    if (currentUserCep && produto.vendedor_id) {
      calculateDeliveryInfo();
    }
  }, [currentUserCep, produto.vendedor_id]);

  return {
    deliveryInfo,
    calculateDeliveryInfo,
    currentUserCep
  };
};
