-- Clean up orphan orders and improve sync integrity

-- First, let's create a function to clean up orphan orders (orders without items)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_orders()
RETURNS TABLE(deleted_count integer, orphan_order_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphan_orders uuid[];
  deleted_orders integer := 0;
BEGIN
  -- Find orders that have no items
  SELECT array_agg(o.id) INTO orphan_orders
  FROM public.orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.order_items oi 
    WHERE oi.order_id = o.id
  );
  
  -- Log orphan orders found
  INSERT INTO public.vendor_orders_log (order_id, message)
  VALUES ('00000000-0000-0000-0000-000000000000', 
          'Found ' || COALESCE(array_length(orphan_orders, 1), 0) || ' orphan orders to clean up');
  
  -- Delete orphan orders if any exist
  IF orphan_orders IS NOT NULL AND array_length(orphan_orders, 1) > 0 THEN
    DELETE FROM public.orders WHERE id = ANY(orphan_orders);
    GET DIAGNOSTICS deleted_orders = ROW_COUNT;
    
    -- Log cleanup
    INSERT INTO public.vendor_orders_log (order_id, message)
    VALUES ('00000000-0000-0000-0000-000000000000', 
            'Cleaned up ' || deleted_orders || ' orphan orders');
  END IF;
  
  RETURN QUERY SELECT deleted_orders, COALESCE(orphan_orders, ARRAY[]::uuid[]);
END;
$$;

-- Improve the existing migration function to handle edge cases better
CREATE OR REPLACE FUNCTION public.migrate_missing_orders_to_pedidos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  migrated_count INTEGER := 0;
  order_record RECORD;
  vendor_record RECORD;
  new_pedido_id UUID;
  vendor_total NUMERIC;
  existing_pedido_count INTEGER;
  orphan_count INTEGER;
BEGIN
  -- Log início da migração
  INSERT INTO public.vendor_orders_log (order_id, message)
  VALUES ('00000000-0000-0000-0000-000000000000', 'Starting enhanced migration of missing orders to pedidos');
  
  -- First, clean up orphan orders
  SELECT deleted_count INTO orphan_count FROM public.cleanup_orphan_orders();
  
  -- Processar apenas pedidos que NÃO estão na tabela pedidos E que têm itens
  FOR order_record IN (
    SELECT o.* FROM public.orders o
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pedidos p 
      WHERE p.usuario_id = o.cliente_id 
      AND ABS(EXTRACT(EPOCH FROM (p.created_at - o.created_at))) < 300 -- 5 minutos de tolerância
    )
    AND EXISTS (
      SELECT 1 FROM public.order_items oi 
      WHERE oi.order_id = o.id
    )
    ORDER BY o.created_at DESC
  ) LOOP
    
    -- Para cada vendedor envolvido neste pedido
    FOR vendor_record IN (
      SELECT DISTINCT v.id as vendor_id, v.nome_loja
      FROM order_items oi
      JOIN produtos p ON oi.produto_id = p.id
      JOIN vendedores v ON p.vendedor_id = v.id
      WHERE oi.order_id = order_record.id
    ) LOOP
      
      -- Verificar se já existe um pedido para este vendedor e cliente na mesma data
      SELECT COUNT(*) INTO existing_pedido_count
      FROM public.pedidos p
      WHERE p.usuario_id = order_record.cliente_id
      AND p.vendedor_id = vendor_record.vendor_id
      AND ABS(EXTRACT(EPOCH FROM (p.created_at - order_record.created_at))) < 300; -- 5 minutos
      
      -- Se não existe, criar
      IF existing_pedido_count = 0 THEN
        -- Calcular total para este vendedor
        SELECT COALESCE(SUM(oi.subtotal), 0) INTO vendor_total
        FROM order_items oi
        JOIN produtos p ON oi.produto_id = p.id
        WHERE oi.order_id = order_record.id AND p.vendedor_id = vendor_record.vendor_id;
        
        -- Só criar pedido se houver valor total > 0
        IF vendor_total > 0 THEN
          -- Gerar novo UUID
          new_pedido_id := gen_random_uuid();
          
          -- Criar pedido
          INSERT INTO public.pedidos (
            id,
            usuario_id,
            vendedor_id,
            status,
            forma_pagamento,
            endereco_entrega,
            valor_total,
            cupom_codigo,
            desconto_aplicado,
            created_at
          ) VALUES (
            new_pedido_id,
            order_record.cliente_id,
            vendor_record.vendor_id,
            order_record.status,
            order_record.forma_pagamento,
            order_record.endereco_entrega,
            vendor_total,
            order_record.cupom_codigo,
            CASE 
              WHEN order_record.desconto_aplicado IS NOT NULL AND order_record.desconto_aplicado > 0 
              THEN order_record.desconto_aplicado * (vendor_total / NULLIF(order_record.valor_total, 0))
              ELSE 0 
            END,
            order_record.created_at
          );
          
          -- Copiar itens
          INSERT INTO public.itens_pedido (
            pedido_id,
            produto_id,
            quantidade,
            preco_unitario,
            total,
            created_at
          )
          SELECT 
            new_pedido_id,
            oi.produto_id,
            oi.quantidade,
            oi.preco_unitario,
            oi.subtotal,
            oi.created_at
          FROM order_items oi
          JOIN produtos p ON oi.produto_id = p.id
          WHERE oi.order_id = order_record.id AND p.vendedor_id = vendor_record.vendor_id;
          
          migrated_count := migrated_count + 1;
          
          -- Log migração
          INSERT INTO public.vendor_orders_log (order_id, message)
          VALUES (order_record.id, 'Enhanced migration: created pedido for vendor ' || vendor_record.nome_loja || ' with total ' || vendor_total);
        ELSE
          -- Log pedidos com valor zero
          INSERT INTO public.vendor_orders_log (order_id, message)
          VALUES (order_record.id, 'Skipped order with zero total for vendor: ' || vendor_record.nome_loja);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Log conclusão
  INSERT INTO public.vendor_orders_log (order_id, message)
  VALUES ('00000000-0000-0000-0000-000000000000', 
          'Enhanced migration completed. Cleaned: ' || orphan_count || ' orphan orders. Migrated: ' || migrated_count || ' pedidos');
  
  RETURN migrated_count;
END;
$$;

-- Create a function to prevent creation of orders without items (validation)
CREATE OR REPLACE FUNCTION public.validate_order_has_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow the order to be created initially, but we'll check later via a deferred constraint or manual validation
  -- This is because order_items might be inserted after the order in the same transaction
  RETURN NEW;
END;
$$;

-- Add a function to check order integrity after transaction
CREATE OR REPLACE FUNCTION public.check_order_integrity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orphan_orders_found integer;
BEGIN
  -- Count orders without items that are older than 5 minutes (should have items by now)
  SELECT COUNT(*) INTO orphan_orders_found
  FROM public.orders o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.order_items oi 
    WHERE oi.order_id = o.id
  )
  AND o.created_at < (now() - interval '5 minutes');
  
  -- Log if orphan orders are found
  IF orphan_orders_found > 0 THEN
    INSERT INTO public.vendor_orders_log (order_id, message)
    VALUES ('00000000-0000-0000-0000-000000000000', 
            'WARNING: Found ' || orphan_orders_found || ' orders without items older than 5 minutes');
  END IF;
END;
$$;