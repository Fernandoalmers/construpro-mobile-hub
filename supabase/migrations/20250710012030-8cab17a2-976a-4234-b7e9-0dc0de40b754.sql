-- Fix critical search_path security vulnerabilities in database functions
-- This migration adds SET search_path = 'public' to all functions with mutable search_path

-- Fix update functions (triggers)
CREATE OR REPLACE FUNCTION public.update_promotional_coupons_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vendor_delivery_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_delivery_context_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_pedidos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix business logic functions
CREATE OR REPLACE FUNCTION public.update_expired_promotions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE produtos 
  SET promocao_ativa = false 
  WHERE promocao_ativa = true 
    AND promocao_fim < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_product_delivery_restriction(p_vendor_id uuid, p_product_id uuid, p_customer_cep text)
RETURNS TABLE(has_restriction boolean, restriction_type text, restriction_message text, delivery_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH cep_clean AS (
    SELECT regexp_replace(p_customer_cep, '[^0-9]', '', 'g') as clean_cep
  ),
  restrictions AS (
    SELECT 
      r.restriction_type,
      r.restriction_message,
      CASE 
        WHEN r.zone_type = 'cep_specific' THEN 
          (SELECT clean_cep FROM cep_clean) = regexp_replace(r.zone_value, '[^0-9]', '', 'g')
        WHEN r.zone_type = 'cep_range' THEN
          (SELECT clean_cep::INTEGER FROM cep_clean) BETWEEN 
            regexp_replace(split_part(r.zone_value, '-', 1), '[^0-9]', '', 'g')::INTEGER AND
            regexp_replace(split_part(r.zone_value, '-', 2), '[^0-9]', '', 'g')::INTEGER
        WHEN r.zone_type = 'ibge' THEN
          EXISTS (
            SELECT 1 FROM zip_cache z 
            WHERE z.cep = (SELECT clean_cep FROM cep_clean) 
            AND z.ibge = r.zone_value
          )
        ELSE false
      END as matches
    FROM vendor_product_restrictions r
    WHERE r.vendor_id = p_vendor_id 
    AND r.product_id = p_product_id 
    AND r.active = true
  )
  SELECT 
    COALESCE(bool_or(r.matches), false) as has_restriction,
    COALESCE(string_agg(r.restriction_type, ', ') FILTER (WHERE r.matches), '') as restriction_type,
    COALESCE(string_agg(r.restriction_message, '; ') FILTER (WHERE r.matches), '') as restriction_message,
    NOT COALESCE(bool_or(r.matches AND r.restriction_type = 'not_delivered'), false) as delivery_available
  FROM restrictions r;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_sync_integrity()
RETURNS TABLE(total_orders bigint, total_pedidos bigint, missing_pedidos bigint, sync_status text, last_check timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  orders_count BIGINT;
  pedidos_count BIGINT;
  missing_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO orders_count FROM orders;
  
  SELECT COUNT(DISTINCT (usuario_id, DATE_TRUNC('minute', created_at))) INTO pedidos_count 
  FROM pedidos;
  
  SELECT COUNT(*) INTO missing_count
  FROM orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM pedidos p 
    WHERE p.usuario_id = o.cliente_id 
    AND ABS(EXTRACT(EPOCH FROM (p.created_at - o.created_at))) < 300
  );
  
  RETURN QUERY SELECT 
    orders_count,
    pedidos_count,
    missing_count,
    CASE 
      WHEN missing_count = 0 THEN 'SYNC_OK'
      WHEN missing_count <= 3 THEN 'SYNC_WARNING'
      ELSE 'SYNC_CRITICAL'
    END,
    now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_principal_address_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.principal = true THEN
    UPDATE profiles 
    SET endereco_principal = jsonb_build_object(
      'logradouro', NEW.logradouro,
      'numero', NEW.numero,
      'complemento', NEW.complemento,
      'bairro', NEW.bairro,
      'cidade', NEW.cidade,
      'estado', NEW.estado,
      'cep', NEW.cep
    ),
    updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  IF OLD.principal = true AND NEW.principal = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_addresses 
      WHERE user_id = NEW.user_id AND principal = true AND id != NEW.id
    ) THEN
      UPDATE profiles 
      SET endereco_principal = null,
          updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_principal_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.principal = true AND (OLD IS NULL OR OLD.principal = false) THEN
    UPDATE user_addresses 
    SET principal = false, updated_at = now()
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND principal = true;
      
    UPDATE profiles 
    SET endereco_principal = jsonb_build_object(
      'logradouro', NEW.logradouro,
      'numero', NEW.numero,
      'complemento', NEW.complemento,
      'bairro', NEW.bairro,
      'cidade', NEW.cidade,
      'estado', NEW.estado,
      'cep', NEW.cep
    ),
    updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_orphan_orders()
RETURNS TABLE(deleted_count integer, orphan_order_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  orphan_orders uuid[];
  deleted_orders integer := 0;
BEGIN
  SELECT array_agg(o.id) INTO orphan_orders
  FROM orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM order_items oi 
    WHERE oi.order_id = o.id
  );
  
  INSERT INTO vendor_orders_log (order_id, message)
  VALUES ('00000000-0000-0000-0000-000000000000', 
          'Found ' || COALESCE(array_length(orphan_orders, 1), 0) || ' orphan orders to clean up');
  
  IF orphan_orders IS NOT NULL AND array_length(orphan_orders, 1) > 0 THEN
    DELETE FROM orders WHERE id = ANY(orphan_orders);
    GET DIAGNOSTICS deleted_orders = ROW_COUNT;
    
    INSERT INTO vendor_orders_log (order_id, message)
    VALUES ('00000000-0000-0000-0000-000000000000', 
            'Cleaned up ' || deleted_orders || ' orphan orders');
  END IF;
  
  RETURN QUERY SELECT deleted_orders, COALESCE(orphan_orders, ARRAY[]::uuid[]);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_product_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE produtos 
  SET imagens = (
    SELECT COALESCE(
      json_agg(pi.url ORDER BY pi.ordem, pi.created_at),
      '[]'::json
    )::jsonb
    FROM product_images pi 
    WHERE pi.product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_product_stock(p_produto_id uuid, p_quantidade integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_stock integer;
BEGIN
  SELECT estoque INTO current_stock
  FROM produtos
  WHERE id = p_produto_id;
  
  RETURN current_stock >= p_quantidade;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_inventory_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE produtos
  SET estoque = GREATEST(0, estoque - NEW.quantidade)
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$function$;

-- Fix data masking functions
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF cpf_input IS NULL OR length(cpf_input) < 11 THEN
    RETURN cpf_input;
  END IF;
  
  RETURN concat(
    substring(cpf_input from 1 for 3),
    '.***.',
    substring(cpf_input from 9 for 2),
    '-**'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  at_pos integer;
  username_part text;
  domain_part text;
BEGIN
  IF email_input IS NULL OR position('@' in email_input) = 0 THEN
    RETURN email_input;
  END IF;
  
  at_pos := position('@' in email_input);
  username_part := substring(email_input from 1 for at_pos - 1);
  domain_part := substring(email_input from at_pos);
  
  IF length(username_part) <= 2 THEN
    RETURN concat('**', domain_part);
  ELSE
    RETURN concat(
      substring(username_part from 1 for 2),
      repeat('*', length(username_part) - 2),
      domain_part
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  clean_phone text;
BEGIN
  IF phone_input IS NULL THEN
    RETURN phone_input;
  END IF;
  
  clean_phone := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  IF length(clean_phone) >= 10 THEN
    RETURN concat(
      substring(clean_phone from 1 for 2),
      ' (**) ****-',
      substring(clean_phone from length(clean_phone) - 3)
    );
  ELSE
    RETURN phone_input;
  END IF;
END;
$function$;