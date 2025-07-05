-- Corrigir funções com ambiguidade na referência order_id
-- Primeiro fazer DROP e recriar para evitar conflitos de parâmetros

DROP FUNCTION IF EXISTS public.can_vendor_access_order(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_access_order(uuid);

-- Recriar função can_vendor_access_order sem ambiguidade
CREATE OR REPLACE FUNCTION public.can_vendor_access_order(p_order_id uuid, p_vendor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN produtos p ON oi.produto_id = p.id
    WHERE oi.order_id = p_order_id
    AND p.vendedor_id = p_vendor_id
  );
END;
$function$;

-- Recriar função can_access_order sem ambiguidade
CREATE OR REPLACE FUNCTION public.can_access_order(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = p_order_id AND cliente_id = auth.uid()
  );
END;
$function$;