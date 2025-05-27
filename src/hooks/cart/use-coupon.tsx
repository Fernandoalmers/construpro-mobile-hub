
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { couponsService } from '@/services/couponsService';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const applyCoupon = useCallback(async (code: string, orderValue: number = 0) => {
    if (!code || code.trim() === '') {
      toast.error("Por favor, insira um cupom válido");
      return;
    }
    
    try {
      setIsValidating(true);
      
      // Validar cupom com valor do pedido
      const validation = await couponsService.validateCoupon(code.toUpperCase(), orderValue);
      
      if (validation.valid && validation.discount_amount) {
        setAppliedCoupon({
          code: code.toUpperCase(),
          discount: validation.discount_amount
        });
        toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
      } else {
        toast.error(validation.message || "Cupom inválido ou expirado");
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error("Erro ao validar cupom");
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success("Cupom removido");
  }, []);
  
  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidating,
    applyCoupon,
    removeCoupon
  };
};
