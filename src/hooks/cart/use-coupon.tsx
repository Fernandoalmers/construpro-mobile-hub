
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
      console.log('[useCoupon] Iniciando validação do cupom:', {
        code: code.toUpperCase(),
        orderValue,
        userId,
        cartItemsCount: cartItems?.length || 0
      });

      // Preparar dados dos itens do carrinho
      const cartItemsData = cartItems?.map(item => {
        const produtoId = item.produto?.id || item.product_id || item.produto_id;
        const quantidade = item.quantidade || item.quantity || 1;
        const preco = item.produto?.preco_promocional || 
                     item.produto?.preco_normal || 
                     item.price_at_add || 
                     item.preco_unitario ||
                     item.preco ||
                     0;

        return {
          produto_id: String(produtoId || ''),
          quantidade: Number(quantidade) || 1,
          preco: Number(preco) || 0
        };
      }).filter(item => item.produto_id && item.preco > 0) || [];

      console.log('[useCoupon] Dados preparados para validação:', {
        cartItemsProcessed: cartItemsData.length,
        totalValue: cartItemsData.reduce((sum, item) => sum + (item.preco * item.quantidade), 0)
      });

      // Tentar múltiplas vezes com delay para resolver problemas temporários
      let validationResult;
      let functionError;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`[useCoupon] Tentativa ${retryCount + 1} de validação do cupom`);
          
          const { data: result, error } = await supabase.rpc('validate_coupon', {
            coupon_code: code.toUpperCase().trim(),
            user_id_param: userId,
            order_value: Number(orderValue) || 0,
            cart_items: cartItemsData.length > 0 ? cartItemsData : null
          });

          if (error) {
            functionError = error;
            console.error(`[useCoupon] Erro na tentativa ${retryCount + 1}:`, error);
            
            // Se for erro de configuração específico, tentar corrigir
            if (error.message?.includes('operator does not exist') || 
                error.message?.includes('time zone') ||
                error.message?.includes('validate_coupon')) {
              
              if (retryCount === 0) {
                console.log('[useCoupon] Detectado erro de configuração, executando correção...');
                try {
                  await supabase.functions.invoke('fix-coupon-validation');
                  console.log('[useCoupon] Correção executada, tentando novamente...');
                } catch (fixError) {
                  console.log('[useCoupon] Erro ao executar correção:', fixError);
                }
              }
              
              // Aguardar antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              retryCount++;
              continue;
            } else {
              break;
            }
          } else {
            validationResult = result;
            functionError = null;
            break;
          }
        } catch (err) {
          console.error(`[useCoupon] Erro inesperado na tentativa ${retryCount + 1}:`, err);
          functionError = err;
          retryCount++;
          
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (functionError) {
        console.error('[useCoupon] Erro após todas as tentativas:', functionError);
        
        // Tratamento específico para erros conhecidos
        if (functionError.message?.includes('function "validate_coupon" does not exist')) {
          toast.error('Sistema de cupons em configuração. Recarregue a página e tente novamente.');
        } else if (functionError.message?.includes('operator does not exist') || 
                   functionError.message?.includes('time zone')) {
          toast.error('Erro de configuração corrigido. Recarregue a página e tente novamente.');
        } else {
          toast.error(`Erro ao validar cupom: ${functionError.message}`);
        }
        return;
      }

      console.log('[useCoupon] Resposta da validação:', validationResult);

      if (validationResult && validationResult.length > 0) {
        const result = validationResult[0];
        
        if (result.valid) {
          const discountAmount = Number(result.discount_amount) || 0;
          
          setAppliedCoupon({
            code: code.toUpperCase().trim(),
            discount: discountAmount
          });
          
          // Mensagem de sucesso baseada nos produtos elegíveis
          if (result.eligible_products && result.eligible_products !== null) {
            try {
              const eligibleProducts = typeof result.eligible_products === 'string' 
                ? JSON.parse(result.eligible_products) 
                : result.eligible_products;
              
              if (Array.isArray(eligibleProducts) && eligibleProducts.length > 0) {
                const eligibleCount = eligibleProducts.length;
                const totalItems = cartItemsData.length;
                
                if (eligibleCount < totalItems && totalItems > 0) {
                  toast.success(`Cupom aplicado! Desconto válido para ${eligibleCount} de ${totalItems} produtos.`);
                } else {
                  toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
                }
              } else {
                toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
              }
            } catch (parseError) {
              console.error('[useCoupon] Erro ao processar produtos elegíveis:', parseError);
              toast.success(`Cupom ${code.toUpperCase()} aplicado com sucesso!`);
            }
          } else {
            toast.success(`Cupom ${code.toUpperCase()} aplicado! Desconto de R$ ${discountAmount.toFixed(2)}`);
          }
          
          console.log('[useCoupon] Cupom aplicado com sucesso:', {
            code: code.toUpperCase(),
            discount: discountAmount
          });
        } else {
          const errorMessage = result.message || "Cupom inválido";
          console.log('[useCoupon] Cupom inválido:', errorMessage);
          toast.error(errorMessage);
        }
      } else {
        console.log('[useCoupon] Nenhum resultado retornado da validação');
        toast.error("Erro ao validar cupom. Recarregue a página e tente novamente.");
      }
    } catch (error: any) {
      console.error('[useCoupon] Erro inesperado:', error);
      toast.error("Erro inesperado ao aplicar cupom. Recarregue a página e tente novamente.");
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success("Cupom removido");
    console.log('[useCoupon] Cupom removido');
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
