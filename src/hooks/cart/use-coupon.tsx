
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
      console.log('[useCoupon] Starting coupon validation:', {
        code: code.toUpperCase(),
        orderValue,
        userId,
        cartItemsCount: cartItems?.length || 0
      });

      // Preparar dados dos itens do carrinho de forma mais robusta
      const cartItemsData = cartItems?.map(item => {
        // Extrair produto_id de diferentes possíveis estruturas
        let produtoId = item.produto?.id || item.product_id || item.produto_id;
        
        // Extrair quantidade de diferentes possíveis estruturas
        let quantidade = item.quantidade || item.quantity || 1;
        
        // Extrair preço de diferentes possíveis estruturas
        let preco = item.produto?.preco_normal || 
                   item.produto?.preco_promocional || 
                   item.price_at_add || 
                   item.preco_unitario ||
                   item.preco ||
                   0;

        // Garantir tipos corretos
        const safeProdutoId = String(produtoId || '');
        const safeQuantidade = Number(quantidade) || 1;
        const safePreco = Number(preco) || 0;

        console.log('[useCoupon] Processing cart item:', {
          original: item,
          processed: {
            produto_id: safeProdutoId,
            quantidade: safeQuantidade,
            preco: safePreco
          }
        });

        return {
          produto_id: safeProdutoId,
          quantidade: safeQuantidade,
          preco: safePreco
        };
      }).filter(item => item.produto_id && item.preco > 0) || [];

      console.log('[useCoupon] Final cart items for validation:', cartItemsData);

      // Debug: Verificar se a função validate_coupon existe
      const { data: functionExists, error: functionError } = await supabase.rpc('validate_coupon', {
        coupon_code: code.toUpperCase().trim(),
        user_id_param: userId,
        order_value: Number(orderValue) || 0,
        cart_items: cartItemsData.length > 0 ? cartItemsData : null
      }).catch(err => {
        console.error('[useCoupon] RPC call failed:', err);
        
        if (err.message?.includes('function "validate_coupon" does not exist')) {
          console.error('[useCoupon] validate_coupon function does not exist in database');
          return { data: null, error: { message: 'Função de validação de cupom não encontrada no banco de dados. Contate o suporte.' } };
        }
        
        return { data: null, error: err };
      });

      if (functionError) {
        console.error('[useCoupon] Supabase RPC error:', functionError);
        
        if (functionError.message?.includes('function "validate_coupon" does not exist')) {
          toast.error('Sistema de cupons em manutenção. Tente novamente mais tarde.');
        } else {
          toast.error('Erro interno ao validar cupom. Detalhes: ' + functionError.message);
        }
        return;
      }

      console.log('[useCoupon] Validation response:', functionExists);

      if (functionExists && functionExists.length > 0) {
        const result = functionExists[0];
        
        if (result.valid) {
          const discountAmount = Number(result.discount_amount) || 0;
          
          setAppliedCoupon({
            code: code.toUpperCase().trim(),
            discount: discountAmount
          });
          
          // Determinar mensagem de sucesso baseada nos produtos elegíveis
          if (result.eligible_products && result.eligible_products !== null) {
            try {
              const eligibleProducts = typeof result.eligible_products === 'string' 
                ? JSON.parse(result.eligible_products) 
                : result.eligible_products;
              
              if (Array.isArray(eligibleProducts) && eligibleProducts.length > 0) {
                const eligibleCount = eligibleProducts.length;
                const totalItems = cartItemsData.length;
                
                if (eligibleCount < totalItems && totalItems > 0) {
                  toast.success(`Cupom aplicado! Desconto válido para ${eligibleCount} de ${totalItems} produtos no carrinho.`);
                } else {
                  toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
                }
              } else {
                toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
              }
            } catch (parseError) {
              console.error('[useCoupon] Error parsing eligible_products:', parseError);
              toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
            }
          } else {
            toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
          }
          
          console.log('[useCoupon] Coupon applied successfully:', {
            code: code.toUpperCase(),
            discount: discountAmount
          });
        } else {
          const errorMessage = result.message || "Cupom inválido";
          console.log('[useCoupon] Coupon validation failed:', errorMessage);
          toast.error(errorMessage);
        }
      } else {
        console.log('[useCoupon] No validation result returned');
        toast.error("Erro ao validar cupom. Tente novamente.");
      }
    } catch (error: any) {
      console.error('[useCoupon] Unexpected error:', error);
      
      // Melhor tratamento de erros para debugging
      if (error.message) {
        if (error.message.includes('validate_coupon')) {
          toast.error("Sistema de cupons temporariamente indisponível. Tente novamente em alguns minutos.");
        } else {
          toast.error("Erro inesperado: " + error.message);
        }
      } else {
        toast.error("Erro inesperado ao aplicar cupom. Tente novamente.");
      }
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success("Cupom removido");
    console.log('[useCoupon] Coupon removed');
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
