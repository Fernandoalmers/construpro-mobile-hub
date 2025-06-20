
import { useState, useEffect, useCallback } from 'react';
import { getProductDeliveryInfo } from '@/utils/delivery';
import { CartItem } from '@/types/cart';
import { Address } from '@/services/addressService';
import { StoreGroup } from '@/hooks/cart/use-group-items-by-store';

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

export function useCheckoutDelivery(storeGroups: StoreGroup[], selectedAddress: Address | null) {
  const [deliveryState, setDeliveryState] = useState<CheckoutDeliveryState>({
    storeDeliveries: {},
    totalShipping: 0,
    isCalculating: false,
    allDeliveryAvailable: true,
    hasRestrictedItems: false
  });

  const calculateDeliveryForStores = useCallback(async () => {
    if (!selectedAddress || !storeGroups.length) {
      console.log('[useCheckoutDelivery] No address or stores, skipping calculation');
      return;
    }

    console.log('[useCheckoutDelivery] Starting delivery calculation for stores:', {
      storesCount: storeGroups.length,
      selectedAddress: selectedAddress.cep
    });

    setDeliveryState(prev => ({ ...prev, isCalculating: true }));

    const newStoreDeliveries: Record<string, StoreDeliveryInfo> = {};
    let totalShipping = 0;
    let allAvailable = true;
    let hasRestrictions = false;

    for (const storeGroup of storeGroups) {
      const storeId = storeGroup.loja.id;
      const storeName = storeGroup.loja.nome;

      console.log(`[useCheckoutDelivery] Calculating for store: ${storeName} (${storeId})`);

      // Initialize store delivery info with loading state
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
        // Get the first product from this store to use for delivery calculation
        const firstItem = storeGroup.items[0];
        if (!firstItem?.produto?.vendedor_id) {
          console.warn(`[useCheckoutDelivery] No vendor ID for store ${storeName}`);
          newStoreDeliveries[storeId] = {
            ...newStoreDeliveries[storeId],
            message: 'Frete será calculado na finalização',
            loading: false,
            error: 'Vendor ID not found'
          };
          continue;
        }

        const deliveryInfo = await getProductDeliveryInfo(
          firstItem.produto.vendedor_id,
          firstItem.produto.id,
          selectedAddress.cep
        );

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

        // Accumulate shipping costs
        totalShipping += deliveryInfo.deliveryFee || 0;

        // Track if any store has restrictions or unavailable delivery
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
          message: 'Frete será informado na finalização',
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    setDeliveryState({
      storeDeliveries: newStoreDeliveries,
      totalShipping,
      isCalculating: false,
      allDeliveryAvailable: allAvailable,
      hasRestrictedItems: hasRestrictions
    });

    console.log('[useCheckoutDelivery] Calculation completed:', {
      totalShipping,
      allAvailable,
      hasRestrictions
    });

  }, [storeGroups, selectedAddress]);

  // Recalculate when address or store groups change
  useEffect(() => {
    calculateDeliveryForStores();
  }, [calculateDeliveryForStores]);

  return {
    ...deliveryState,
    recalculateDelivery: calculateDeliveryForStores
  };
}
