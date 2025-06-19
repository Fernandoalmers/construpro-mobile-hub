
import { useEffect, useCallback, useRef } from 'react';
import { CartItem } from '@/types/cart';
import { validateCartPromotions, getPromotionsEndingSoon } from '@/services/cart/promotionValidator';
import { toast } from '@/components/ui/sonner';

interface UseCartPromotionValidatorProps {
  cartItems: CartItem[];
  onRemoveExpiredItems: (expiredItems: CartItem[]) => Promise<void>;
  enabled?: boolean;
}

export const useCartPromotionValidator = ({
  cartItems,
  onRemoveExpiredItems,
  enabled = true
}: UseCartPromotionValidatorProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const notifiedEndingSoonRef = useRef<Set<string>>(new Set());

  const validatePromotions = useCallback(async () => {
    if (!enabled || cartItems.length === 0) return;

    console.log('[useCartPromotionValidator] Validating promotions for', cartItems.length, 'items');

    const validationResult = validateCartPromotions(cartItems);

    if (validationResult.hasExpiredItems) {
      console.log('[useCartPromotionValidator] Found expired items:', validationResult.expiredItems.length);
      
      // Remove expired items
      try {
        await onRemoveExpiredItems(validationResult.expiredItems);
        
        // Show notification
        if (validationResult.message) {
          toast.warning('Promoção expirada', {
            description: validationResult.message
          });
        }
      } catch (error) {
        console.error('[useCartPromotionValidator] Error removing expired items:', error);
      }
    }

    // Check for promotions ending soon and notify
    const endingSoon = getPromotionsEndingSoon(validationResult.validItems);
    
    endingSoon.forEach(item => {
      const productId = item.produto?.id;
      if (productId && !notifiedEndingSoonRef.current.has(productId)) {
        notifiedEndingSoonRef.current.add(productId);
        
        toast.info('Promoção terminando em breve!', {
          description: `A oferta de "${item.produto?.nome}" expira em breve. Finalize sua compra para garantir o desconto.`
        });
      }
    });

    lastCheckRef.current = Date.now();
  }, [cartItems, onRemoveExpiredItems, enabled]);

  // Validate immediately when cart items change
  useEffect(() => {
    if (enabled && cartItems.length > 0) {
      validatePromotions();
    }
  }, [cartItems, validatePromotions, enabled]);

  // Set up periodic validation (every 30 seconds)
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      validatePromotions();
    }, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [validatePromotions, enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    validatePromotions,
    lastCheck: lastCheckRef.current
  };
};
