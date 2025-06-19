import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/services/productService';
import { getProductDeliveryInfo, getStoreLocationInfo } from '@/utils/delivery';
import { useUserAddress } from './useUserAddress';
import { useTempCep } from './useTempCep';
import { useAuth } from '@/context/AuthContext';

interface DeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  deliveryFee?: number;
  loading: boolean;
}

interface UserAddress {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface StoreLocationInfo {
  cep?: string;
  ibge?: string;
  zona?: string;
}

interface ProductDeliveryInfo {
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  deliveryFee?: number;
  productId: string;
  vendorId: string;
  hasRestrictions: boolean;
  deliveryAvailable: boolean;
}

export function useProductDelivery(produto: Product) {
  const { getUserMainAddress, currentUserCep } = useUserAddress();
  const { tempCep, clearIfUserHasAddress } = useTempCep();
  const { isAuthenticated, profile } = useAuth();
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    isLocal: false,
    message: 'Calculando informações de entrega...',
    loading: true
  });

  // Enhanced delivery calculation with CORRECTED CEP prioritization
  const calculateDeliveryInfo = useCallback(async (forceRecalculate = false) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [useProductDelivery] 🚚 Starting delivery calculation for product:`, produto.id);
    console.log(`[${timestamp}] [useProductDelivery] Product vendor ID:`, produto.vendedor_id);
    
    try {
      setDeliveryInfo(prev => ({ ...prev, loading: true }));

      // Get user's main address with increased patience
      console.log(`[${timestamp}] [useProductDelivery] Getting user main address...`);
      const userMainAddress = await Promise.race([
        getUserMainAddress() as Promise<UserAddress | null>,
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Address fetch timeout')), 8000)
        )
      ]);
      
      const addressTime = Date.now() - startTime;
      console.log(`[${timestamp}] [useProductDelivery] User address lookup completed (${addressTime}ms)`);

      // CORRIGIDO: Determinar qual CEP usar com priorização adequada
      const hasUserRegisteredAddress = userMainAddress?.cep || profile?.endereco_principal?.cep || currentUserCep;
      
      console.log(`[${timestamp}] [useProductDelivery] 📍 CEP Priority Analysis:`, {
        hasUserRegisteredAddress: !!hasUserRegisteredAddress,
        userMainAddressCep: userMainAddress?.cep,
        profileMainAddressCep: profile?.endereco_principal?.cep,
        currentUserCep,
        tempCep,
        isAuthenticated
      });

      // Clear temp CEP if user has registered address and temp wasn't set in current session
      if (hasUserRegisteredAddress) {
        clearIfUserHasAddress(true);
      }

      // NOVA LÓGICA: Para usuários autenticados com endereço, sempre usar endereço cadastrado
      // Só usar tempCep se for usuário não autenticado OU se não tiver endereço cadastrado
      let customerCep: string | undefined;
      
      if (isAuthenticated && hasUserRegisteredAddress) {
        // Usuário autenticado com endereço: sempre usar endereço cadastrado
        customerCep = userMainAddress?.cep || profile?.endereco_principal?.cep || currentUserCep;
        console.log(`[${timestamp}] [useProductDelivery] ✅ Using registered address CEP:`, customerCep);
      } else if (tempCep) {
        // Usuário não autenticado ou sem endereço: usar CEP temporário se disponível
        customerCep = tempCep;
        console.log(`[${timestamp}] [useProductDelivery] ✅ Using temporary CEP:`, customerCep);
      }

      console.log(`[${timestamp}] [useProductDelivery] 📍 Final CEP Selection:`, {
        customerCep,
        source: isAuthenticated && hasUserRegisteredAddress ? 'registered_address' : tempCep ? 'temporary' : 'none'
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

      // Get store location info with increased timeout
      console.log(`[${timestamp}] [useProductDelivery] Getting store location info...`);
      const storeLocationInfo = await Promise.race([
        getStoreLocationInfo(produto.stores?.id, produto.vendedor_id) as Promise<StoreLocationInfo>,
        new Promise<StoreLocationInfo>((_, reject) => 
          setTimeout(() => reject(new Error('Store location timeout')), 6000)
        )
      ]);
      
      const storeTime = Date.now() - startTime;
      console.log(`[${timestamp}] [useProductDelivery] Store location info (${storeTime}ms):`, storeLocationInfo);

      // Use the enhanced delivery calculation with increased timeout
      console.log(`[${timestamp}] [useProductDelivery] 🔄 Calling getProductDeliveryInfo with:`, {
        vendorId: produto.vendedor_id,
        productId: produto.id,
        customerCep,
        storeCep: storeLocationInfo?.cep,
        storeIbge: storeLocationInfo?.ibge
      });
      
      const info = await Promise.race([
        getProductDeliveryInfo(
          produto.vendedor_id,
          produto.id,
          customerCep,
          storeLocationInfo?.cep,
          storeLocationInfo?.ibge
        ) as Promise<ProductDeliveryInfo>,
        new Promise<ProductDeliveryInfo>((_, reject) => 
          setTimeout(() => reject(new Error('Delivery info timeout')), 15000)
        )
      ]);
      
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
      
      // Fallback melhorado - tenta fornecer informação útil mesmo com erro
      setDeliveryInfo({
        isLocal: false,
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
        loading: false
      });
    }
  }, [produto.vendedor_id, produto.id, produto.stores?.id, getUserMainAddress, tempCep, isAuthenticated, profile?.endereco_principal?.cep, currentUserCep, clearIfUserHasAddress]);

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
