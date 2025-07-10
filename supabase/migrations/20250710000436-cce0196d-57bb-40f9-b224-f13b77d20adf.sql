-- Desabilitar temporariamente o trigger problemático para diagnosticar
ALTER TABLE public.pedidos DISABLE TRIGGER sync_pedidos_status_to_orders_trigger;