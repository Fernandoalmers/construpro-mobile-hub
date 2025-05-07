
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  
  // Apply coupon code
  const applyCoupon = (code: string) => {
    if (!code) {
      toast.error('Digite um cupom válido');
      return;
    }

    // Mock coupon validation
    if (code.toUpperCase() === 'CONSTRUPROMO') {
      setAppliedCoupon({ code, discount: 10 });
      toast.success('Cupom aplicado! Desconto de 10% aplicado ao seu pedido.');
    } else if (code.toUpperCase() === 'WELCOME20') {
      setAppliedCoupon({ code, discount: 20 });
      toast.success('Cupom aplicado! Desconto de 20% aplicado ao seu pedido.');
    } else if (code.toUpperCase() === 'FRETE') {
      setAppliedCoupon({ code, discount: 5 });
      toast.success('Cupom aplicado! Desconto de 5% aplicado ao seu pedido.');
    } else {
      toast.error('O cupom informado não é válido ou expirou.');
    }
    
    setCouponCode('');
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.success('Cupom removido');
  };
  
  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    applyCoupon,
    removeCoupon
  };
};
