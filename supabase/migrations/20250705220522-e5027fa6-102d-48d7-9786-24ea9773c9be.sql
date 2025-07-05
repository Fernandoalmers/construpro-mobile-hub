-- Corrigir função com ambiguidade na referência order_id
CREATE OR REPLACE FUNCTION public.can_vendor_access_order(p_order_id uuid, vendor_id uuid)
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
    AND p.vendedor_id = vendor_id
  );
END;
$function$;

-- Corrigir função can_access_order também
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