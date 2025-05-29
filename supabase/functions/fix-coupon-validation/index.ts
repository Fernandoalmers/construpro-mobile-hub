
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { supabase } = await import('https://esm.sh/@supabase/supabase-js@2')
    
    const supabaseClient = supabase(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Fixing validate_coupon function...')

    // Corrigir a função validate_coupon com tipos de data consistentes
    const { error } = await supabaseClient.rpc('execute_custom_sql', {
      sql_statement: `
        CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code text, user_id_param uuid, order_value numeric, cart_items jsonb DEFAULT NULL::jsonb)
        RETURNS TABLE(valid boolean, coupon_id uuid, discount_type text, discount_value numeric, discount_amount numeric, message text, eligible_products jsonb)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
        DECLARE
          coupon_record RECORD;
          calculated_discount NUMERIC;
          user_usage_count INTEGER;
          eligible_total NUMERIC := 0;
          eligible_items JSONB := '[]'::jsonb;
          has_specific_products BOOLEAN := false;
          item JSONB;
          current_timestamp TIMESTAMPTZ := now();
        BEGIN
          -- Log para debug
          RAISE NOTICE 'Validating coupon: % for user: % with order value: %', coupon_code, user_id_param, order_value;
          
          -- Buscar cupom (case insensitive)
          SELECT * INTO coupon_record
          FROM public.coupons
          WHERE UPPER(code) = UPPER(coupon_code) AND active = true;
          
          IF NOT FOUND THEN
            RAISE NOTICE 'Coupon not found or inactive: %', coupon_code;
            RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Cupom inválido ou não encontrado', NULL::JSONB;
            RETURN;
          END IF;
          
          -- Verificar data de início (conversão explícita para timestamp)
          IF coupon_record.starts_at IS NOT NULL AND current_timestamp < coupon_record.starts_at::timestamptz THEN
            RAISE NOTICE 'Coupon not yet valid. Current: %, Starts: %', current_timestamp, coupon_record.starts_at;
            RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
              'Cupom ainda não está válido. Válido a partir de ' || to_char(coupon_record.starts_at::timestamptz, 'DD/MM/YYYY HH24:MI'), NULL::JSONB;
            RETURN;
          END IF;
          
          -- Verificar data de expiração (conversão explícita para timestamp)
          IF coupon_record.expires_at IS NOT NULL AND current_timestamp > coupon_record.expires_at::timestamptz THEN
            RAISE NOTICE 'Coupon expired. Current: %, Expires: %', current_timestamp, coupon_record.expires_at;
            RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
              'Cupom expirado em ' || to_char(coupon_record.expires_at::timestamptz, 'DD/MM/YYYY HH24:MI'), NULL::JSONB;
            RETURN;
          END IF;
          
          -- Verificar limite de uso total
          IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
            RAISE NOTICE 'Coupon usage limit exceeded. Used: %, Max: %', coupon_record.used_count, coupon_record.max_uses;
            RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Cupom esgotado', NULL::JSONB;
            RETURN;
          END IF;
          
          -- Verificar se usuário já usou o cupom
          SELECT COUNT(*) INTO user_usage_count
          FROM public.coupon_usage
          WHERE coupon_id = coupon_record.id AND user_id = user_id_param;
          
          IF user_usage_count > 0 THEN
            RAISE NOTICE 'User % already used coupon %', user_id_param, coupon_record.id;
            RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Você já utilizou este cupom', NULL::JSONB;
            RETURN;
          END IF;
          
          -- Verificar se o cupom tem produtos específicos
          SELECT EXISTS(
            SELECT 1 FROM public.coupon_products WHERE coupon_id = coupon_record.id
          ) INTO has_specific_products;
          
          RAISE NOTICE 'Coupon has specific products: %', has_specific_products;
          
          -- Se tem produtos específicos e cart_items foi fornecido, calcular apenas produtos elegíveis
          IF has_specific_products AND cart_items IS NOT NULL THEN
            FOR item IN SELECT * FROM jsonb_array_elements(cart_items)
            LOOP
              -- Verificar se o produto está na lista de produtos elegíveis
              IF EXISTS(
                SELECT 1 FROM public.coupon_products cp 
                WHERE cp.coupon_id = coupon_record.id 
                AND cp.product_id = (item->>'produto_id')::uuid
              ) THEN
                eligible_total := eligible_total + ((item->>'preco')::numeric * (item->>'quantidade')::integer);
                eligible_items := eligible_items || item;
                RAISE NOTICE 'Product % is eligible, adding % to total', item->>'produto_id', ((item->>'preco')::numeric * (item->>'quantidade')::integer);
              END IF;
            END LOOP;
            
            RAISE NOTICE 'Eligible total: %, Min order value: %', eligible_total, coupon_record.min_order_value;
            
            -- Se não há produtos elegíveis no carrinho
            IF eligible_total = 0 THEN
              RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 'Nenhum produto elegível para este cupom no seu carrinho', NULL::JSONB;
              RETURN;
            END IF;
            
            -- Usar o total dos produtos elegíveis para validação
            IF eligible_total < coupon_record.min_order_value THEN
              RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
                'Valor mínimo dos produtos elegíveis não atingido. Necessário: R$ ' || coupon_record.min_order_value::text, NULL::JSONB;
              RETURN;
            END IF;
            
            -- Calcular desconto baseado nos produtos elegíveis
            IF coupon_record.discount_type = 'percentage' THEN
              calculated_discount := eligible_total * (coupon_record.discount_value / 100);
            ELSE
              calculated_discount := coupon_record.discount_value;
            END IF;
            
            -- Garantir que o desconto não seja maior que o valor dos produtos elegíveis
            calculated_discount := LEAST(calculated_discount, eligible_total);
            
          ELSE
            -- Cupom geral (todos os produtos) - usar lógica original
            IF order_value < coupon_record.min_order_value THEN
              RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::NUMERIC, 
                'Valor mínimo do pedido não atingido. Necessário: R$ ' || coupon_record.min_order_value::text, NULL::JSONB;
              RETURN;
            END IF;
            
            -- Calcular desconto
            IF coupon_record.discount_type = 'percentage' THEN
              calculated_discount := order_value * (coupon_record.discount_value / 100);
            ELSE
              calculated_discount := coupon_record.discount_value;
            END IF;
            
            -- Garantir que o desconto não seja maior que o valor do pedido
            calculated_discount := LEAST(calculated_discount, order_value);
            eligible_items := cart_items;
          END IF;
          
          RAISE NOTICE 'Coupon validation successful. Discount: %', calculated_discount;
          RETURN QUERY SELECT true, coupon_record.id, coupon_record.discount_type, coupon_record.discount_value, calculated_discount, 'Cupom válido', eligible_items;
        END;
        $function$;
      `
    })

    if (error) {
      console.error('Error fixing validate_coupon function:', error)
      throw error
    }

    console.log('Successfully fixed validate_coupon function')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Função validate_coupon corrigida com sucesso - tipos de data consistentes' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fix-coupon-validation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Erro ao corrigir função de validação de cupom'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
