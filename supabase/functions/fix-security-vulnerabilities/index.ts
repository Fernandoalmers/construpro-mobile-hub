
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Security vulnerabilities fix request received');
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header required' 
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    console.log('Starting security fixes...');

    // Array of functions to fix with their current definitions and fixed versions
    const functionsToFix = [
      {
        name: 'migrate_missing_orders_to_pedidos',
        sql: `
          CREATE OR REPLACE FUNCTION public.migrate_missing_orders_to_pedidos()
          RETURNS integer
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = 'public'
          AS $function$
          DECLARE
            migrated_count INTEGER := 0;
            order_record RECORD;
            vendor_record RECORD;
            new_pedido_id UUID;
            vendor_total NUMERIC;
            existing_pedido_count INTEGER;
          BEGIN
            -- Log início da migração
            INSERT INTO public.vendor_orders_log (order_id, message)
            VALUES ('00000000-0000-0000-0000-000000000000', 'Starting migration of missing orders to pedidos');
            
            -- Processar apenas pedidos que NÃO estão na tabela pedidos
            FOR order_record IN (
              SELECT o.* FROM public.orders o
              WHERE NOT EXISTS (
                SELECT 1 FROM public.pedidos p 
                WHERE p.usuario_id = o.cliente_id 
                AND ABS(EXTRACT(EPOCH FROM (p.created_at - o.created_at))) < 300 -- 5 minutos de tolerância
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
                  VALUES (order_record.id, 'Migrated missing order to pedidos for vendor: ' || vendor_record.nome_loja);
                END IF;
              END LOOP;
            END LOOP;
            
            -- Log conclusão
            INSERT INTO public.vendor_orders_log (order_id, message)
            VALUES ('00000000-0000-0000-0000-000000000000', 'Completed migration of missing orders. Migrated: ' || migrated_count || ' pedidos');
            
            RETURN migrated_count;
          END;
          $function$;
        `
      },
      {
        name: 'sync_order_to_pedidos',
        sql: `
          CREATE OR REPLACE FUNCTION public.sync_order_to_pedidos()
          RETURNS trigger
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = 'public'
          AS $function$
          DECLARE
            vendor_id UUID;
            vendor_record RECORD;
            new_pedido_id UUID;
            vendor_total NUMERIC;
          BEGIN
            -- Log início do processo
            INSERT INTO public.vendor_orders_log (order_id, message)
            VALUES (NEW.id, 'Starting automatic sync from orders to pedidos for order: ' || NEW.id);
            
            -- Para cada vendedor envolvido no pedido, criar um registro em pedidos
            FOR vendor_record IN (
              SELECT DISTINCT v.id as vendor_id, v.nome_loja
              FROM order_items oi
              JOIN produtos p ON oi.produto_id = p.id
              JOIN vendedores v ON p.vendedor_id = v.id
              WHERE oi.order_id = NEW.id
            ) LOOP
              vendor_id := vendor_record.vendor_id;
              
              -- Calcular total para este vendedor neste pedido
              SELECT COALESCE(SUM(oi.subtotal), 0) INTO vendor_total
              FROM order_items oi
              JOIN produtos p ON oi.produto_id = p.id
              WHERE oi.order_id = NEW.id AND p.vendedor_id = vendor_id;
              
              -- Gerar novo UUID para o pedido
              new_pedido_id := gen_random_uuid();
              
              -- Criar registro na tabela pedidos
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
                NEW.cliente_id,
                vendor_id,
                NEW.status,
                NEW.forma_pagamento,
                NEW.endereco_entrega,
                vendor_total,
                NEW.cupom_codigo,
                CASE 
                  WHEN NEW.desconto_aplicado IS NOT NULL AND NEW.desconto_aplicado > 0 
                  THEN NEW.desconto_aplicado * (vendor_total / NULLIF(NEW.valor_total, 0))
                  ELSE 0 
                END,
                NEW.created_at
              );
              
              -- Copiar itens do pedido para este vendedor
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
              WHERE oi.order_id = NEW.id AND p.vendedor_id = vendor_id;
              
              -- Log sucesso
              INSERT INTO public.vendor_orders_log (order_id, message)
              VALUES (NEW.id, 'Successfully synced order to pedidos for vendor: ' || vendor_record.nome_loja || ' (pedido_id: ' || new_pedido_id || ')');
              
            END LOOP;
            
            -- Log conclusão
            INSERT INTO public.vendor_orders_log (order_id, message)
            VALUES (NEW.id, 'Completed automatic sync from orders to pedidos');
            
            RETURN NEW;
          END;
          $function$;
        `
      },
      {
        name: 'check_sync_integrity',
        sql: `
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
            -- Contar orders
            SELECT COUNT(*) INTO orders_count FROM public.orders;
            
            -- Contar pedidos únicos (baseado em usuario_id e created_at)
            SELECT COUNT(DISTINCT (usuario_id, DATE_TRUNC('minute', created_at))) INTO pedidos_count 
            FROM public.pedidos;
            
            -- Contar orders sem pedidos correspondentes
            SELECT COUNT(*) INTO missing_count
            FROM public.orders o
            WHERE NOT EXISTS (
              SELECT 1 FROM public.pedidos p 
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
        `
      },
      {
        name: 'check_product_stock',
        sql: `
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
            FROM public.produtos
            WHERE id = p_produto_id;
            
            RETURN current_stock >= p_quantidade;
          END;
          $function$;
        `
      },
      {
        name: 'update_inventory_on_order',
        sql: `
          CREATE OR REPLACE FUNCTION public.update_inventory_on_order(p_produto_id uuid, p_quantidade integer)
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = 'public'
          AS $function$
          BEGIN
            -- Update product inventory by reducing it by the quantity ordered
            UPDATE public.produtos
            SET estoque = GREATEST(0, estoque - p_quantidade)
            WHERE id = p_produto_id;
            
            -- Log the inventory update for debugging
            RAISE NOTICE 'Updated inventory for product % by reducing %', p_produto_id, p_quantidade;
          END;
          $function$;
        `
      },
      {
        name: 'update_inventory_on_order_item',
        sql: `
          CREATE OR REPLACE FUNCTION public.update_inventory_on_order_item()
          RETURNS trigger
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = 'public'
          AS $function$
          BEGIN
            -- Update product inventory by reducing it by the quantity ordered
            UPDATE public.produtos
            SET estoque = GREATEST(0, estoque - NEW.quantidade)
            WHERE id = NEW.produto_id;
            
            -- Log the inventory update for debugging
            RAISE NOTICE 'Trigger: Updated inventory for product % by reducing %', NEW.produto_id, NEW.quantidade;
            
            RETURN NEW;
          END;
          $function$;
        `
      }
    ];

    let fixedCount = 0;
    let errors = [];

    // Execute each function fix
    for (const func of functionsToFix) {
      try {
        console.log(`Fixing function: ${func.name}`);
        
        const { error } = await supabase.rpc('execute_custom_sql', {
          sql_statement: func.sql
        });

        if (error) {
          console.error(`Error fixing function ${func.name}:`, error);
          errors.push(`${func.name}: ${error.message}`);
        } else {
          console.log(`Successfully fixed function: ${func.name}`);
          fixedCount++;
        }
      } catch (err) {
        console.error(`Exception fixing function ${func.name}:`, err);
        errors.push(`${func.name}: ${err.message}`);
      }
    }

    console.log(`Security fixes completed. Fixed: ${fixedCount}/${functionsToFix.length} functions`);

    const result = {
      success: true,
      message: `Security vulnerabilities fixed successfully`,
      details: {
        functionsFixed: fixedCount,
        totalFunctions: functionsToFix.length,
        fixedFunctions: functionsToFix.map(f => f.name),
        errors: errors.length > 0 ? errors : null
      }
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in security fixes:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to apply security fixes' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
