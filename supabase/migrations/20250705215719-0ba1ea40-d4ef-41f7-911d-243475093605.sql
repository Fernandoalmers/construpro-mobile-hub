-- Corrigir campos de quantidade para aceitar valores fracionados
-- Alterar order_items.quantidade de INTEGER para NUMERIC
ALTER TABLE public.order_items 
ALTER COLUMN quantidade TYPE NUMERIC USING quantidade::NUMERIC;

-- Alterar itens_pedido.quantidade de INTEGER para NUMERIC  
ALTER TABLE public.itens_pedido 
ALTER COLUMN quantidade TYPE NUMERIC USING quantidade::NUMERIC;

-- Limpar transações de pontos órfãs (sem pedidos correspondentes)
DELETE FROM public.points_transactions 
WHERE tipo = 'compra' 
AND referencia_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM public.orders WHERE id = points_transactions.referencia_id
);

-- Recalcular saldo de pontos para usuários afetados
WITH user_balances AS (
  SELECT 
    user_id,
    COALESCE(SUM(pontos), 0) as calculated_balance
  FROM points_transactions 
  GROUP BY user_id
)
UPDATE profiles 
SET saldo_pontos = user_balances.calculated_balance
FROM user_balances 
WHERE profiles.id = user_balances.user_id
AND profiles.saldo_pontos != user_balances.calculated_balance;