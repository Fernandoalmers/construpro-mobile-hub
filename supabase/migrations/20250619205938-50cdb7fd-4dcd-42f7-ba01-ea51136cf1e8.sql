
-- Migration para corrigir a sincronização de endereços principais
-- Atualizar profiles com endereços principais existentes que não foram sincronizados
UPDATE profiles 
SET endereco_principal = jsonb_build_object(
  'logradouro', ua.logradouro,
  'numero', ua.numero,
  'complemento', ua.complemento,
  'bairro', ua.bairro,
  'cidade', ua.cidade,
  'estado', ua.estado,
  'cep', ua.cep
),
updated_at = now()
FROM user_addresses ua
WHERE profiles.id = ua.user_id 
  AND ua.principal = true 
  AND (profiles.endereco_principal IS NULL OR profiles.endereco_principal = '{}' OR profiles.endereco_principal = 'null');

-- Garantir que pelo menos um endereço seja marcado como principal para usuários que têm endereços
UPDATE user_addresses 
SET principal = true
WHERE id IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_addresses ua1
  WHERE NOT EXISTS (
    SELECT 1 FROM user_addresses ua2 
    WHERE ua2.user_id = ua1.user_id AND ua2.principal = true
  )
  ORDER BY user_id, created_at ASC
);

-- Sincronizar os endereços que foram marcados como principal
UPDATE profiles 
SET endereco_principal = jsonb_build_object(
  'logradouro', ua.logradouro,
  'numero', ua.numero,
  'complemento', ua.complemento,
  'bairro', ua.bairro,
  'cidade', ua.cidade,
  'estado', ua.estado,
  'cep', ua.cep
),
updated_at = now()
FROM user_addresses ua
WHERE profiles.id = ua.user_id 
  AND ua.principal = true 
  AND (profiles.endereco_principal IS NULL OR profiles.endereco_principal = '{}' OR profiles.endereco_principal = 'null');
