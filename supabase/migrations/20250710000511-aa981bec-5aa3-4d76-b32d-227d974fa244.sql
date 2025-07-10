-- Desabilitar todos os triggers que podem estar causando conflito
ALTER TABLE public.pedidos DISABLE TRIGGER sync_pedidos_to_orders;
ALTER TABLE public.pedidos DISABLE TRIGGER sync_pedidos_with_reference_update;