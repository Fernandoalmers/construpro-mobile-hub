
-- Create a secure function to update pedido status that bypasses RLS using SECURITY DEFINER
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
BEGIN
  -- Validate status
  IF NOT (p_new_status = ANY(valid_statuses)) THEN
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
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;

  -- Check permissions (vendedor must own the pedido)
  IF pedido_record.vendedor_id != p_vendedor_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Acesso negado: Vendedor não é dono do pedido'
    );
  END IF;

  -- Update the pedido status
  UPDATE pedidos 
  SET status = p_new_status, 
      updated_at = now()
  WHERE id = p_pedido_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Status atualizado para ' || p_new_status,
    'pedido_id', p_pedido_id,
    'new_status', p_new_status,
    'updated_at', now()
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro interno: ' || SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_pedido_status_secure(uuid, uuid, text) TO authenticated;
