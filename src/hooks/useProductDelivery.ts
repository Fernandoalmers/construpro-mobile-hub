
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
  const { clearTemporaryCep } = useTempCep();
  const { isAuthenticated, profile } = useAuth();
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    isLocal: false,
    message: 'Calculando informações de entrega...',
    loading: true
  });

  // NOVA LÓGICA: Sempre priorizar endereço cadastrado para usuários autenticados
  const calculateDeliveryInfo = useCallback(async (forceRecalculate = false) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [useProductDelivery] 🚚 STARTING DELIVERY CALCULATION for product:`, produto.id);
    console.log(`[${timestamp}] [useProductDelivery] Product vendor ID:`, produto.vendedor_id);
    
    try {
      setDeliveryInfo(prev => ({ ...prev, loading: true }));

      let customerCep: string | undefined;

      if (isAuthenticated) {
        // PRIORIDADE ABSOLUTA: Para usuários autenticados, SEMPRE usar endereço cadastrado
        console.log(`[${timestamp}] [useProductDelivery] ✅ User authenticated, getting registered address...`);
        
        // Limpar qualquer CEP temporário que possa existir
        clearTemporaryCep();

        // Buscar endereço principal do usuário
        try {
          const userMainAddress = await Promise.race([
            getUserMainAddress() as Promise<UserAddress | null>,
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Address fetch timeout')), 8000)
            )
          ]);

          // Verificar várias fontes de endereço cadastrado
          const registeredCep = userMainAddress?.cep || profile?.endereco_principal?.cep || currentUserCep;
          
          if (registeredCep) {
            customerCep = registeredCep.replace(/\D/g, ''); // Limpar formatação
            console.log(`[${timestamp}] [useProductDelivery] ✅ USING REGISTERED ADDRESS CEP:`, {
              original: registeredCep,
              cleaned: customerCep,
              source: userMainAddress?.cep ? 'getUserMainAddress' : 
                      profile?.endereco_principal?.cep ? 'profile.endereco_principal' : 
                      'currentUserCep'
            });
          } else {
            console.log(`[${timestamp}] [useProductDelivery] ❌ NO REGISTERED ADDRESS found`);
            setDeliveryInfo({
              isLocal: false,
              message: 'Cadastre seu endereço para calcular o frete',
              loading: false
            });
            return;
          }
        } catch (addressError) {
          console.error(`[${timestamp}] [useProductDelivery] Error fetching user address:`, addressError);
          setDeliveryInfo({
            isLocal: false,
            message: 'Erro ao buscar endereço cadastrado',
            loading: false
          });
          return;
        }
      } else {
        // Para usuários não autenticados: sem CEP temporário mais
        console.log(`[${timestamp}] [useProductDelivery] ❌ User not authenticated - no delivery calculation`);
        setDeliveryInfo({
          isLocal: false,
          message: 'Faça login para calcular o frete automaticamente',
          loading: false
        });
        return;
      }

      console.log(`[${timestamp}] [useProductDelivery] 📍 FINAL CEP FOR CALCULATION:`, {
        customerCep,
        isAuthenticated,
        source: 'registered_address_only'
      });

      // Get store location info
      console.log(`[${timestamp}] [useProductDelivery] Getting store location info...`);
      const storeLocationInfo = await Promise.race([
        getStoreLocationInfo(produto.stores?.id, produto.vendedor_id) as Promise<StoreLocationInfo>,
        new Promise<StoreLocationInfo>((_, reject) => 
          setTimeout(() => reject(new Error('Store location timeout')), 6000)
        )
      ]);
      
      const storeTime = Date.now() - startTime;
      console.log(`[${timestamp}] [useProductDelivery] Store location info (${storeTime}ms):`, storeLocationInfo);

      // Calculate delivery info
      console.log(`[${timestamp}] [useProductDelivery] 🔄 CALLING getProductDeliveryInfo with:`, {
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
      console.log(`[${timestamp}] [useProductDelivery] ✅ DELIVERY CALCULATION FINAL RESULT (${totalTime}ms):`, info);

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
        message: 'Frete calculado no checkout',
        estimatedTime: 'Prazo informado após confirmação do pedido',
        loading: false
      });
    }
  }, [produto.vendedor_id, produto.id, produto.stores?.id, getUserMainAddress, isAuthenticated, profile?.endereco_principal?.cep, currentUserCep, clearTemporaryCep]);

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
    currentUserCep: isAuthenticated ? (profile?.endereco_principal?.cep || currentUserCep) : null
  };
}
