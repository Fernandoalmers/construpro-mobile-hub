
-- Adicionar 'Cancelado' ao constraint da tabela orders
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Confirmado', 'Em Separação', 'Em Trânsito', 'Entregue', 'Cancelado'));
