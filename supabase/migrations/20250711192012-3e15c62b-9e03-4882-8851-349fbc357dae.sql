
-- Corrigir o constraint único da tabela user_delivery_context
ALTER TABLE public.user_delivery_context 
ADD CONSTRAINT user_delivery_context_user_id_unique UNIQUE (user_id);
