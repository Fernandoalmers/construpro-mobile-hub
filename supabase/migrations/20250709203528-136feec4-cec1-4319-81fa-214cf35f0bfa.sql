
-- Update the secure function to handle mixed case statuses that actually exist in the database
CREATE OR REPLACE FUNCTION public.update_pedido_status_secure(
  p_pedido_id uuid,
  p_vendedor_id uuid,
  p_new_status text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pedido_record RECORD;
  valid_statuses text[] := ARRAY['pendente', 'Pendente', 'confirmado', 'Confirmado', 'processando', 'Processando', 'enviado', 'Enviado', 'entregue', 'Entregue', 'cancelado', 'Cancelado'];
  normalized_status text;
BEGIN
  -- Normalize the new status to lowercase for validation and storage
  normalized_status := lower(p_new_status);
  
  -- Log the function call for debugging
  RAISE NOTICE 'update_pedido_status_secure called with pedido_id: %, vendedor_id: %, new_status: %', p_pedido_id, p_vendedor_id, p_new_status;

  -- Validate status (accept both cases but normalize to lowercase)
  IF NOT (p_new_status = ANY(valid_statuses)) THEN
    RAISE NOTICE 'Invalid status provided: %, valid statuses: %', p_new_status, valid_statuses;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Status inválido: ' || p_new_status,
      'valid_statuses', array_to_json(valid_statuses)
    );
  END IF;

  -- Check if pedido exists and get info
  SELECT id, vendedor_id, status, usuario_id INTO pedido_record
  FROM pedidos
  WHERE id = p_pedido_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Pedido not found: %', p_pedido_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;

  RAISE NOTICE 'Pedido found: id=%, vendedor_id=%, current_status=%, usuario_id=%', 
    pedido_record.id, pedido_record.vendedor_id, pedido_record.status, pedido_record.usuario_id;

  -- Check permissions (vendedor must own the pedido)
  IF pedido_record.vendedor_id != p_vendedor_id THEN
    RAISE NOTICE 'Access denied: pedido vendedor=%, request vendedor=%', pedido_record.vendedor_id, p_vendedor_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Acesso negado: Vendedor não é dono do pedido'
    );
  END IF;

  -- Update the pedido status (store in lowercase for consistency)
  UPDATE pedidos 
  SET status = normalized_status, 
      updated_at = now()
  WHERE id = p_pedido_id;

  RAISE NOTICE 'Pedido status updated from % to %', pedido_record.status, normalized_status;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Status atualizado para ' || normalized_status,
    'pedido_id', p_pedido_id,
    'new_status', normalized_status,
    'updated_at', now()
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Exception in update_pedido_status_secure: %', SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno: ' || SQLERRM
  );
END;
$$;
