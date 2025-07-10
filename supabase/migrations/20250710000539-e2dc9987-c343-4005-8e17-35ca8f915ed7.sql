-- Reabilitar o trigger com a função corrigida
ALTER TABLE public.pedidos ENABLE TRIGGER sync_pedidos_status_to_orders_trigger;

-- Manter os outros triggers desabilitados por enquanto para evitar conflitos
-- ALTER TABLE public.pedidos ENABLE TRIGGER sync_pedidos_to_orders;
-- ALTER TABLE public.pedidos ENABLE TRIGGER sync_pedidos_with_reference_update;