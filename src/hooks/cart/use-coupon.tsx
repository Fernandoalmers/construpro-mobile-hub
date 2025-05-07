
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  
  const applyCoupon = useCallback((code: string) => {
    // Simple validation
    if (!code || code.trim() === '') {
      toast.error("Por favor, insira um cupom válido");
      return;
    }
    
    // For demo purposes, we'll use some hardcoded coupons
    // In a real application, this would validate against a backend API
    const validCoupons: Record<string, number> = {
      'BEMVINDO10': 10.00,
      'FRETE20': 20.00,
      'CONSTRUPRO15': 15.00
    };
    
    if (validCoupons[code.toUpperCase()]) {
      setAppliedCoupon({
        code: code.toUpperCase(),
        discount: validCoupons[code.toUpperCase()]
      });
      toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
    } else {
      toast.error("Cupom inválido ou expirado");
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
    applyCoupon,
    removeCoupon
  };
};
