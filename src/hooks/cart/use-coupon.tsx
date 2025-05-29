
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const applyCoupon = useCallback(async (code: string, orderValue: number = 0, userId?: string, cartItems?: any[]) => {
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
      // Preparar dados dos itens do carrinho para validação
      const cartItemsData = cartItems?.map(item => {
        // Safely extract and convert the values to the correct types
        const produtoId = item.produto?.id || item.product_id;
        const quantidade = item.quantidade || item.quantity;
        const preco = item.produto?.preco_normal || item.price_at_add || item.preco_unitario;
        
        // Convert values directly to the correct types with proper type checking
        let safeProdutoId: string;
        if (typeof produtoId === 'string') {
          safeProdutoId = produtoId;
        } else if (typeof produtoId === 'number') {
          safeProdutoId = produtoId.toString();
        } else {
          safeProdutoId = '';
        }
        
        let safeQuantidade: number;
        if (typeof quantidade === 'number') {
          safeQuantidade = quantidade;
        } else if (typeof quantidade === 'string') {
          safeQuantidade = parseFloat(quantidade) || 0;
        } else {
          safeQuantidade = 0;
        }
        
        let safePreco: number;
        if (typeof preco === 'number') {
          safePreco = preco;
        } else if (typeof preco === 'string') {
          safePreco = parseFloat(preco) || 0;
        } else {
          safePreco = 0;
        }
        
        return {
          produto_id: safeProdutoId,
          quantidade: safeQuantidade,
          preco: safePreco
        };
      }) || [];

      console.log('[useCoupon] Validating coupon with cart items:', {
        code: code.toUpperCase(),
        orderValue,
        cartItemsCount: cartItemsData.length
      });

      // Use the validate_coupon function from Supabase with proper type conversions
      const { data, error } = await supabase.rpc('validate_coupon', {
        coupon_code: code.toUpperCase(),
        user_id_param: userId,
        order_value: Number(orderValue), // Ensure it's a number
        cart_items: cartItemsData.length > 0 ? cartItemsData : null
      });

      if (error) {
        console.error('Error validating coupon:', error);
        toast.error('Erro ao validar cupom');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        console.log('[useCoupon] Validation result:', result);
        
        if (result.valid) {
          setAppliedCoupon({
            code: code.toUpperCase(),
            discount: result.discount_amount
          });
          
          // Mostrar informação sobre produtos elegíveis se aplicável
          if (result.eligible_products && JSON.parse(String(result.eligible_products)).length > 0) {
            const eligibleCount = JSON.parse(String(result.eligible_products)).length;
            const totalItems = cartItemsData.length;
            
            if (eligibleCount < totalItems) {
              toast.success(`Cupom ${code.toUpperCase()} aplicado! Desconto válido para ${eligibleCount} de ${totalItems} produtos no carrinho.`);
            } else {
              toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
            }
          } else {
            toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
          }
        } else {
          toast.error(String(result.message) || "Cupom inválido");
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
