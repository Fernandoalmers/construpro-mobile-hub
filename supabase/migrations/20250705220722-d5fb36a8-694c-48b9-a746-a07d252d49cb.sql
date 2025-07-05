-- Corrigir funções com ambiguidade na referência order_id
-- Primeiro fazer DROP CASCADE das funções e suas dependências

DROP FUNCTION IF EXISTS public.can_vendor_access_order(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_order(uuid) CASCADE;

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

-- Recriar as políticas RLS que dependiam dessas funções
DROP POLICY IF EXISTS "Vendedores podem ver pedidos sem recursão" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can update their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;

-- Política para orders
CREATE POLICY "Vendedores podem ver pedidos sem recursão" ON public.orders
FOR SELECT
USING (
  (auth.uid() = cliente_id) OR 
  (auth.uid() = (SELECT profiles.id FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)) OR
  (EXISTS (SELECT 1 FROM vendedores v WHERE v.usuario_id = auth.uid() AND can_vendor_access_order(orders.id, v.id)))
);

-- Políticas para order_items
CREATE POLICY "Users can insert their order items" ON public.order_items
FOR INSERT
WITH CHECK (can_access_order(order_id));

CREATE POLICY "Users can update their order items" ON public.order_items
FOR UPDATE
USING (can_access_order(order_id));

CREATE POLICY "Users can view their order items" ON public.order_items
FOR SELECT
USING (can_access_order(order_id));