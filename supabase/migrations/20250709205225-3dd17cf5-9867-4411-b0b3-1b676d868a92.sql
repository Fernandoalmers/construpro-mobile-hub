-- Fix the update_pedido_status_secure function to handle vendor ID and status issues
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
  valid_statuses text[] := ARRAY['pendente', 'confirmado', 'processando', 'enviado', 'entregue', 'cancelado'];
  normalized_status text;
BEGIN
  -- Normalize the new status to lowercase for validation and storage
  normalized_status := lower(trim(p_new_status));
  
  -- Log the function call for debugging
  RAISE NOTICE 'update_pedido_status_secure called with pedido_id: %, vendedor_id: %, new_status: %, normalized: %', 
    p_pedido_id, p_vendedor_id, p_new_status, normalized_status;

  -- Validate status (normalize to lowercase for comparison)
  IF NOT (normalized_status = ANY(valid_statuses)) THEN
    RAISE NOTICE 'Invalid status provided: %, normalized: %, valid statuses: %', p_new_status, normalized_status, valid_statuses;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Status inválido: ' || p_new_status || '. Use: ' || array_to_string(valid_statuses, ', '),
      'valid_statuses', array_to_json(valid_statuses),
      'received_status', p_new_status,
      'normalized_status', normalized_status
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
      'error', 'Pedido não encontrado',
      'pedido_id', p_pedido_id
    );
  END IF;

  RAISE NOTICE 'Pedido found: id=%, vendedor_id=%, current_status=%, usuario_id=%', 
    pedido_record.id, pedido_record.vendedor_id, pedido_record.status, pedido_record.usuario_id;

  -- Check permissions (vendedor must own the pedido) - explicit UUID comparison
  IF pedido_record.vendedor_id::text != p_vendedor_id::text THEN
    RAISE NOTICE 'Access denied: pedido vendedor=% (%), request vendedor=% (%)', 
      pedido_record.vendedor_id, pedido_record.vendedor_id::text, p_vendedor_id, p_vendedor_id::text;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Acesso negado: Vendedor não é dono do pedido',
      'pedido_vendedor_id', pedido_record.vendedor_id,
      'request_vendedor_id', p_vendedor_id
    );
  END IF;

  -- Update the pedido status (store in lowercase for consistency)
  UPDATE pedidos 
  SET status = normalized_status, 
      updated_at = now()
  WHERE id = p_pedido_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE NOTICE 'Update failed for pedido: %', p_pedido_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Falha ao atualizar o pedido'
    );
  END IF;

  RAISE NOTICE 'Pedido status updated successfully from % to %', pedido_record.status, normalized_status;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Status atualizado para ' || normalized_status,
    'pedido_id', p_pedido_id,
    'new_status', normalized_status,
    'old_status', pedido_record.status,
    'updated_at', now()
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Exception in update_pedido_status_secure: %, SQLSTATE: %', SQLERRM, SQLSTATE;
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno: ' || SQLERRM,
    'sqlstate', SQLSTATE,
    'context', 'exception_handler'
  );
END;
$$;