-- Create missing RPC function for inventory management
CREATE OR REPLACE FUNCTION public.update_inventory_on_order(
  p_produto_id uuid,
  p_quantidade integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update stock in produtos table
  UPDATE produtos 
  SET estoque = GREATEST(0, estoque - p_quantidade),
      updated_at = now()
  WHERE id = p_produto_id;
  
  -- Log if no rows were affected (product not found)
  IF NOT FOUND THEN
    RAISE WARNING 'Product % not found for inventory update', p_produto_id;
  END IF;
END;
$function$;