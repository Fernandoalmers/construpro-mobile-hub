-- Remover função e triggers dependentes com CASCADE
DROP FUNCTION IF EXISTS public.sync_order_status_bidirectional() CASCADE;

-- Desabilitar o trigger que queremos manter
ALTER TABLE public.pedidos DISABLE TRIGGER sync_pedidos_status_to_orders_trigger;

-- Sincronizar manualmente os status existentes  
UPDATE public.orders 
SET status = CASE 
  WHEN p.status = 'Pendente' THEN 'Confirmado'
  WHEN p.status = 'Confirmado' THEN 'Confirmado' 
  WHEN p.status = 'Processando' THEN 'Em Separação'
  WHEN p.status = 'Enviado' THEN 'Em Trânsito'
  WHEN p.status = 'Entregue' THEN 'Entregue'
  WHEN p.status = 'Cancelado' THEN 'Cancelado'
  ELSE 'Confirmado'
END,
updated_at = now()
FROM public.pedidos p 
WHERE orders.id = p.order_id 
AND p.order_id IS NOT NULL;

-- Recriar a função do trigger de forma mais robusta
CREATE OR REPLACE FUNCTION public.sync_pedidos_status_to_orders()
RETURNS TRIGGER AS $$
DECLARE 
  mapped_status text;
  order_exists boolean;
BEGIN
  -- Só proceder se o status mudou e existe order_id
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.order_id IS NOT NULL THEN
    
    -- Verificar se o order existe antes de tentar atualizar
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE id = NEW.order_id) INTO order_exists;
    
    IF NOT order_exists THEN
      -- Log que o order não existe e continuar sem erro
      INSERT INTO public.vendor_orders_log (order_id, message)
      VALUES (NEW.order_id, 'Tentativa de sincronizar status para order inexistente: ' || NEW.order_id);
      RETURN NEW;
    END IF;
    
    -- Mapear status do pedido para status compatível com orders
    mapped_status := CASE NEW.status
      WHEN 'Pendente' THEN 'Confirmado'
      WHEN 'Confirmado' THEN 'Confirmado'
      WHEN 'Processando' THEN 'Em Separação'
      WHEN 'Enviado' THEN 'Em Trânsito'
      WHEN 'Entregue' THEN 'Entregue'
      WHEN 'Cancelado' THEN 'Cancelado'
      ELSE 'Confirmado' -- fallback
    END;
    
    -- Tentar atualizar com tratamento de erro
    BEGIN
      UPDATE public.orders 
      SET status = mapped_status,
          updated_at = now()
      WHERE id = NEW.order_id;
      
      -- Log da sincronização bem-sucedida
      INSERT INTO public.vendor_orders_log (order_id, message)
      VALUES (NEW.order_id, 'Status sincronizado: pedidos (' || NEW.status || ') -> orders (' || mapped_status || ')');
      
    EXCEPTION WHEN OTHERS THEN
      -- Log do erro mas não interromper o processo
      INSERT INTO public.vendor_orders_log (order_id, message)
      VALUES (NEW.order_id, 'Erro na sincronização de status: ' || SQLERRM);
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reabilitar o trigger com a função corrigida
ALTER TABLE public.pedidos ENABLE TRIGGER sync_pedidos_status_to_orders_trigger;

-- Log da operação
INSERT INTO public.vendor_orders_log (order_id, message)
VALUES ('00000000-0000-0000-0000-000000000000', 'Triggers problemáticos removidos e trigger principal reabilitado com melhorias');