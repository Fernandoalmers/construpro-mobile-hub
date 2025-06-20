
import { useState, useEffect, useCallback, useRef } from 'react';
import { getProductDeliveryInfo } from '@/utils/delivery';
import { CartItem } from '@/types/cart';
import { Address } from '@/services/addressService';
import { StoreGroup } from '@/hooks/cart/use-group-items-by-store';
import { supabase } from '@/integrations/supabase/client';

interface StoreDeliveryInfo {
  storeId: string;
  storeName: string;
  isLocal: boolean;
  message: string;
  estimatedTime?: string;
  deliveryFee: number;
  hasRestrictions: boolean;
  deliveryAvailable: boolean;
  loading: boolean;
  error?: string;
}

interface CheckoutDeliveryState {
  storeDeliveries: Record<string, StoreDeliveryInfo>;
  totalShipping: number;
  isCalculating: boolean;
  allDeliveryAvailable: boolean;
  hasRestrictedItems: boolean;
}

// Cache para evitar cálculos repetitivos
const deliveryCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 segundos

export function useCheckoutDelivery(storeGroups: StoreGroup[], selectedAddress: Address | null) {
  const [deliveryState, setDeliveryState] = useState<CheckoutDeliveryState>({
    storeDeliveries: {},
    totalShipping: 0,
    isCalculating: false,
    allDeliveryAvailable: true,
    hasRestrictedItems: false
  });

  // Refs para controle de loops
  const isCalculatingRef = useRef(false);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationKeyRef = useRef<string>('');

  // Função para buscar vendedor_id a partir do loja_id
  const getVendorIdFromStore = useCallback(async (lojaId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .select('id')
        .eq('id', lojaId)
        .maybeSingle();
      
      if (error) {
        console.warn(`[useCheckoutDelivery] Error fetching vendor for store ${lojaId}:`, error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error(`[useCheckoutDelivery] Exception fetching vendor:`, error);
      return null;
    }
  }, []);

  const calculateDeliveryForStores = useCallback(async () => {
    if (!selectedAddress || !storeGroups.length) {
      console.log('[useCheckoutDelivery] No address or stores, skipping calculation');
      return;
    }

    // Criar chave única para esta combinação de cálculo
    const calculationKey = `${selectedAddress.cep}-${storeGroups.map(g => g.loja.id).join(',')}`;
    
    // Evitar loops - verificar se já está calculando a mesma coisa
    if (isCalculatingRef.current && lastCalculationKeyRef.current === calculationKey) {
      console.log('[useCheckoutDelivery] Already calculating for this combination, skipping');
      return;
    }

    // Verificar cache primeiro
    const cached = deliveryCache.get(calculationKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('[useCheckoutDelivery] Using cached result');
      setDeliveryState(cached.result);
      return;
    }

    console.log('[useCheckoutDelivery] Starting delivery calculation for stores:', {
      storesCount: storeGroups.length,
      selectedAddress: selectedAddress.cep,
      calculationKey
    });

    // Marcar como calculando
    isCalculatingRef.current = true;
    lastCalculationKeyRef.current = calculationKey;
    
    setDeliveryState(prev => ({ ...prev, isCalculating: true }));

    // Timeout de segurança para evitar loops infinitos
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    calculationTimeoutRef.current = setTimeout(() => {
      console.warn('[useCheckoutDelivery] Calculation timeout reached, forcing completion');
      isCalculatingRef.current = false;
      setDeliveryState(prev => ({
        ...prev,
        isCalculating: false,
        storeDeliveries: Object.fromEntries(
          storeGroups.map(group => [
            group.loja.id,
            {
              storeId: group.loja.id,
              storeName: group.loja.nome,
              isLocal: false,
              message: 'Frete será calculado na finalização',
              deliveryFee: 0,
              hasRestrictions: false,
              deliveryAvailable: true,
              loading: false,
              error: 'Timeout'
            }
          ])
        )
      }));
    }, 15000); // 15 segundos timeout

    const newStoreDeliveries: Record<string, StoreDeliveryInfo> = {};
    let totalShipping = 0;
    let allAvailable = true;
    let hasRestrictions = false;

    try {
      // Processar lojas sequencialmente para evitar sobrecarga
      for (const storeGroup of storeGroups) {
        const storeId = storeGroup.loja.id;
        const storeName = storeGroup.loja.nome;

        console.log(`[useCheckoutDelivery] Processing store: ${storeName} (${storeId})`);

        // Inicializar com estado de loading
        newStoreDeliveries[storeId] = {
          storeId,
          storeName,
          isLocal: false,
          message: 'Calculando frete...',
          deliveryFee: 0,
          hasRestrictions: false,
          deliveryAvailable: true,
          loading: true
        };

        try {
          const firstItem = storeGroup.items[0];
          
          // Tentar usar loja_id primeiro, se não funcionar, buscar vendedor_id
          let vendorId = firstItem?.produto?.loja_id;
          
          if (!vendorId) {
            console.warn(`[useCheckoutDelivery] No loja_id for store ${storeName}, trying to fetch vendor_id`);
            vendorId = await getVendorIdFromStore(storeId);
          }

          if (!vendorId) {
            console.warn(`[useCheckoutDelivery] No vendor ID found for store ${storeName}`);
            newStoreDeliveries[storeId] = {
              ...newStoreDeliveries[storeId],
              message: 'Frete será calculado na finalização',
              loading: false,
              error: 'Vendor ID not found'
            };
            continue;
          }

          // Timeout específico para cada chamada de delivery
          const deliveryPromise = getProductDeliveryInfo(
            vendorId,
            firstItem.produto.id,
            selectedAddress.cep
          );

          const deliveryInfo = await Promise.race([
            deliveryPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Individual delivery timeout')), 8000)
            )
          ]);

          console.log(`[useCheckoutDelivery] Delivery info for ${storeName}:`, deliveryInfo);

          newStoreDeliveries[storeId] = {
            storeId,
            storeName,
            isLocal: deliveryInfo.isLocal,
            message: deliveryInfo.message,
            estimatedTime: deliveryInfo.estimatedTime,
            deliveryFee: deliveryInfo.deliveryFee || 0,
            hasRestrictions: deliveryInfo.hasRestrictions,
            deliveryAvailable: deliveryInfo.deliveryAvailable,
            loading: false
          };

          totalShipping += deliveryInfo.deliveryFee || 0;

          if (deliveryInfo.hasRestrictions) {
            hasRestrictions = true;
          }
          if (!deliveryInfo.deliveryAvailable) {
            allAvailable = false;
          }

        } catch (error) {
          console.error(`[useCheckoutDelivery] Error calculating delivery for ${storeName}:`, error);
          newStoreDeliveries[storeId] = {
            ...newStoreDeliveries[storeId],
            message: 'Frete será calculado na finalização',
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      const finalState = {
        storeDeliveries: newStoreDeliveries,
        totalShipping,
        isCalculating: false,
        allDeliveryAvailable: allAvailable,
        hasRestrictedItems: hasRestrictions
      };

      // Salvar no cache
      deliveryCache.set(calculationKey, {
        result: finalState,
        timestamp: Date.now()
      });

      setDeliveryState(finalState);

      console.log('[useCheckoutDelivery] Calculation completed:', {
        totalShipping,
        allAvailable,
        hasRestrictions
      });

    } catch (error) {
      console.error('[useCheckoutDelivery] General calculation error:', error);
      setDeliveryState(prev => ({
        ...prev,
        isCalculating: false,
        storeDeliveries: Object.fromEntries(
          storeGroups.map(group => [
            group.loja.id,
            {
              storeId: group.loja.id,
              storeName: group.loja.nome,
              isLocal: false,
              message: 'Frete será calculado na finalização',
              deliveryFee: 0,
              hasRestrictions: false,
              deliveryAvailable: true,
              loading: false,
              error: 'Calculation failed'
            }
          ])
        )
      }));
    } finally {
      // Limpar flags de controle
      isCalculatingRef.current = false;
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
        calculationTimeoutRef.current = null;
      }
    }

  }, [storeGroups, selectedAddress, getVendorIdFromStore]);

  // Effect otimizado para evitar recalculações desnecessárias
  useEffect(() => {
    // Debounce para evitar chamadas excessivas
    const debounceTimer = setTimeout(() => {
      calculateDeliveryForStores();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [calculateDeliveryForStores]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      isCalculatingRef.current = false;
    };
  }, []);

  return {
    ...deliveryState,
    recalculateDelivery: calculateDeliveryForStores
  };
}
