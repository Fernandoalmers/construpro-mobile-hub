
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDeliveryZones } from './useDeliveryZones';
import type { Product } from '@/services/productService';

interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  loading: boolean;
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

  // Calcular informações de entrega
  const calculateDeliveryInfo = async (forceRecalculate = false) => {
    if (!currentUserCep || (!forceRecalculate && deliveryInfo.loading)) {
      return;
    }

    console.log('[useProductDelivery] Calculando informações de entrega para produto:', produto.id);
    setDeliveryInfo(prev => ({ ...prev, loading: true }));

    try {
      // Se não há zonas ativas ou precisa recalcular, resolver zonas
      if (!hasActiveZones || forceRecalculate) {
        await resolveZones(currentUserCep);
      }

      // Verificar se algum vendedor da zona atual é o vendedor do produto
      const productVendorZone = currentZones.find(zone => zone.vendor_id === produto.vendedor_id);
      
      if (productVendorZone) {
        setDeliveryInfo({
          isLocal: true,
          message: `Entrega disponível para sua região`,
          estimatedTime: 'até 7 dias úteis',
          loading: false
        });
      } else if (hasActiveZones) {
        setDeliveryInfo({
          isLocal: false,
          message: 'Este produto não é entregue na sua região',
          loading: false
        });
      } else {
        setDeliveryInfo({
          isLocal: false,
          message: 'Frete a calcular - consulte o vendedor',
          loading: false
        });
      }
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
  }, [currentUserCep, produto.vendedor_id, hasActiveZones]);

  return {
    deliveryInfo,
    calculateDeliveryInfo,
    currentUserCep
  };
};
