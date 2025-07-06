
-- Fix the get_order_by_id RPC function to use the correct table and improve error handling
CREATE OR REPLACE FUNCTION public.get_order_by_id(order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_data JSONB;
  order_items JSONB;
BEGIN
  -- Get the order data with explicit table aliases
  SELECT to_jsonb(o.*) INTO order_data
  FROM public.orders o
  WHERE o.id = order_id;
  
  IF order_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the order items with product data and explicit table aliases
  -- Use produtos table (the correct one) instead of products
  SELECT json_agg(
    json_build_object(
      'id', oi.id,
      'order_id', oi.order_id,
      'produto_id', oi.produto_id,
      'quantidade', oi.quantidade,
      'preco_unitario', oi.preco_unitario,
      'subtotal', oi.subtotal,
      'created_at', oi.created_at,
      'produto', json_build_object(
        'id', p.id,
        'nome', p.nome,
        'imagens', p.imagens,
        'descricao', p.descricao,
        'preco_normal', p.preco_normal,
        'categoria', p.categoria,
        'unidade_medida', p.unidade_medida
      )
    )
  )::JSONB INTO order_items
  FROM public.order_items oi
  LEFT JOIN public.produtos p ON oi.produto_id = p.id
  WHERE oi.order_id = order_id;
  
  -- Merge order data with items
  IF order_items IS NOT NULL THEN
    order_data = order_data || jsonb_build_object('items', order_items);
  ELSE
    order_data = order_data || jsonb_build_object('items', '[]'::JSONB);
  END IF;
  
  RETURN order_data;
END;
$function$;

-- Clean up duplicate point transactions one more time
WITH duplicate_transactions AS (
  SELECT 
    user_id,
    referencia_id,
    pontos,
    tipo,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, referencia_id, tipo, pontos 
      ORDER BY created_at ASC
    ) as row_num,
    id
  FROM points_transactions 
  WHERE tipo = 'compra' 
  AND referencia_id IS NOT NULL
),
duplicates_to_delete AS (
  SELECT id FROM duplicate_transactions WHERE row_num > 1
)
DELETE FROM points_transactions 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Recalculate points for all affected users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT user_id 
    FROM points_transactions 
    WHERE tipo = 'compra' AND referencia_id IS NOT NULL
  LOOP
    PERFORM public.reconcile_user_points(user_record.user_id);
  END LOOP;
END $$;
