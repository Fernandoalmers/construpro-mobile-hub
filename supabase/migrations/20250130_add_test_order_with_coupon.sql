
-- Inserir um pedido de teste com cupom aplicado para demonstrar a funcionalidade de desconto
INSERT INTO orders (
  id,
  cliente_id,
  status,
  forma_pagamento,
  endereco_entrega,
  valor_total,
  pontos_ganhos,
  desconto_aplicado,
  cupom_codigo,
  created_at
) VALUES (
  'test-order-with-coupon-123',
  (SELECT id FROM profiles WHERE email IS NOT NULL LIMIT 1),
  'Confirmado',
  'credit',
  '{"logradouro": "Rua Teste", "numero": "123", "cidade": "São Paulo", "estado": "SP"}',
  45.00,
  2,
  10.00,
  'DESCONTO10',
  NOW()
);

-- Inserir um item para este pedido de teste
INSERT INTO order_items (
  id,
  order_id,
  produto_id,
  quantidade,
  preco_unitario,
  subtotal
) VALUES (
  gen_random_uuid(),
  'test-order-with-coupon-123',
  (SELECT id FROM produtos LIMIT 1),
  1,
  55.00,
  55.00
);
