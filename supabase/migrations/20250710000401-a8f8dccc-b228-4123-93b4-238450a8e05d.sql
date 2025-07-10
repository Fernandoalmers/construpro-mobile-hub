-- Corrigir função de sincronização para acessar corretamente as colunas
CREATE OR REPLACE FUNCTION public.sync_pedidos_status_to_orders()
RETURNS TRIGGER AS $$
DECLARE 
  mapped_status text;
BEGIN
  -- Atualizar status na tabela orders quando o status do pedido mudar
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.order_id IS NOT NULL THEN
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
    
    UPDATE public.orders 
    SET status = mapped_status 
    WHERE id = NEW.order_id;
    
    -- Log da sincronização
    INSERT INTO public.vendor_orders_log (order_id, message)
    VALUES (NEW.order_id, 'Status synced from pedidos (' || NEW.status || ') to orders (' || mapped_status || ')');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;