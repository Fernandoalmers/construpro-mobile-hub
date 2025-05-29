
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const applyCoupon = useCallback(async (code: string, orderValue: number = 0, userId?: string) => {
    if (!code || code.trim() === '') {
      toast.error("Por favor, insira um cupom válido");
      return;
    }

    if (!userId) {
      toast.error("Usuário não identificado");
      return;
    }

    setIsValidating(true);
    
    try {
      // Use the validate_coupon function from Supabase
      const { data, error } = await supabase.rpc('validate_coupon', {
        coupon_code: code.toUpperCase(),
        user_id_param: userId,
        order_value: orderValue
      });

      if (error) {
        console.error('Error validating coupon:', error);
        toast.error('Erro ao validar cupom');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.valid) {
          setAppliedCoupon({
            code: code.toUpperCase(),
            discount: result.discount_amount
          });
          toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
        } else {
          toast.error(result.message || "Cupom inválido");
        }
      } else {
        toast.error("Cupom inválido ou expirado");
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error("Erro ao aplicar cupom");
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
    applyCoupon,
    removeCoupon,
    isValidating
  };
};
