
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/services/productService';
import { getProductDeliveryInfo, getStoreLocationInfo } from '@/utils/delivery';
import { useUserAddress } from './useUserAddress';
import { useTempCep } from './useTempCep';

interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  deliveryFee?: number;
  loading: boolean;
}

export function useProductDelivery(produto: Product) {
  const { getUserMainAddress, currentUserCep } = useUserAddress();
  const { tempCep } = useTempCep();
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    isLocal: false,
    message: 'Calculando informações de entrega...',
    loading: true
  });

  // Enhanced delivery calculation with improved CEP handling
  const calculateDeliveryInfo = useCallback(async (forceRecalculate = false) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [useProductDelivery] 🚚 Starting delivery calculation for product:`, produto.id);
    console.log(`[${timestamp}] [useProductDelivery] Product vendor ID:`, produto.vendedor_id);
    
    try {
      setDeliveryInfo(prev => ({ ...prev, loading: true }));

      // Get user's main address
      console.log(`[${timestamp}] [useProductDelivery] Getting user main address...`);
      const userMainAddress = await getUserMainAddress();
      
      const addressTime = Date.now() - startTime;
      console.log(`[${timestamp}] [useProductDelivery] User address lookup completed (${addressTime}ms)`);

      // Get store location info
      console.log(`[${timestamp}] [useProductDelivery] Getting store location info...`);
      const storeLocationInfo = await getStoreLocationInfo(produto.stores?.id, produto.vendedor_id);
      
      const storeTime = Date.now() - startTime;
      console.log(`[${timestamp}] [useProductDelivery] Store location info (${storeTime}ms):`, storeLocationInfo);

      // Determine which CEP to use (priority: temp > user registered > none)
      const customerCep = tempCep || userMainAddress?.cep;
      console.log(`[${timestamp}] [useProductDelivery] 📍 CEP Selection:`, {
        tempCep,
        userCep: userMainAddress?.cep,
        finalCep: customerCep,
        source: tempCep ? 'temporary' : userMainAddress?.cep ? 'user_address' : 'none'
      });

      if (!customerCep) {
        console.log(`[${timestamp}] [useProductDelivery] ❌ No CEP available for delivery calculation`);
        setDeliveryInfo({
          isLocal: false,
          message: 'Informe seu CEP para calcular o frete',
          loading: false
        });
        return;
      }

      // Use the enhanced delivery calculation
      console.log(`[${timestamp}] [useProductDelivery] 🔄 Calling getProductDeliveryInfo with:`, {
        vendorId: produto.vendedor_id,
        productId: produto.id,
        customerCep,
        storeCep: storeLocationInfo?.cep,
        storeIbge: storeLocationInfo?.ibge
      });
      
      const info = await getProductDeliveryInfo(
        produto.vendedor_id,
        produto.id,
        customerCep,
        storeLocationInfo?.cep,
        storeLocationInfo?.ibge
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`[${timestamp}] [useProductDelivery] ✅ Delivery calculation result (${totalTime}ms):`, info);

      setDeliveryInfo({
        isLocal: info.isLocal,
        message: info.message,
        estimatedTime: info.estimatedTime,
        deliveryFee: info.deliveryFee,
        loading: false
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[${timestamp}] [useProductDelivery] ❌ Error calculating delivery info (${totalTime}ms):`, error);
      
      setDeliveryInfo({
        isLocal: false,
        message: 'Erro ao calcular informações de entrega',
        estimatedTime: undefined,
        loading: false
      });
    }
  }, [produto.vendedor_id, produto.id, produto.stores?.id, getUserMainAddress, tempCep]);

  // Calculate delivery info when dependencies change
  useEffect(() => {
    if (produto.vendedor_id) {
      calculateDeliveryInfo();
    } else {
      setDeliveryInfo({
        isLocal: false,
        message: 'Informações de entrega não disponíveis',
        loading: false
      });
    }
  }, [calculateDeliveryInfo]);

  return {
    deliveryInfo,
    calculateDeliveryInfo,
    currentUserCep
  };
}
