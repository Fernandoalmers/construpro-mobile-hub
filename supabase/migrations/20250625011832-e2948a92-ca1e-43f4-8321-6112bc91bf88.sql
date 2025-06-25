
-- FASE 1: CORREÇÃO DA INTEGRIDADE DOS DADOS (VERSÃO CORRIGIDA)

-- 1. Primeiro, limpar dados inconsistentes: manter apenas o endereço principal mais recente por usuário
WITH ranked_addresses AS (
  SELECT 
    id,
    user_id,
    principal,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_addresses 
  WHERE principal = true
),
addresses_to_fix AS (
  SELECT user_id
  FROM ranked_addresses
  WHERE rn > 1
)
UPDATE user_addresses 
SET principal = false
WHERE user_id IN (SELECT user_id FROM addresses_to_fix)
  AND id NOT IN (
    SELECT id FROM ranked_addresses WHERE rn = 1
  )
  AND principal = true;

-- 2. Criar constraint para garantir apenas 1 endereço principal por usuário (sem CONCURRENTLY)
CREATE UNIQUE INDEX idx_user_principal_address 
ON user_addresses (user_id) 
WHERE principal = true;

-- 3. Criar função para automaticamente desmarcar outros endereços ao marcar um como principal
CREATE OR REPLACE FUNCTION ensure_single_principal_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o endereço está sendo marcado como principal
  IF NEW.principal = true AND (OLD IS NULL OR OLD.principal = false) THEN
    -- Desmarcar todos os outros endereços como principal para este usuário
    UPDATE user_addresses 
    SET principal = false, updated_at = now()
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND principal = true;
      
    -- Sincronizar com a tabela profiles
    UPDATE profiles 
    SET endereco_principal = jsonb_build_object(
      'logradouro', NEW.logradouro,
      'numero', NEW.numero,
      'complemento', NEW.complemento,
      'bairro', NEW.bairro,
      'cidade', NEW.cidade,
      'estado', NEW.estado,
      'cep', NEW.cep
    ),
    updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para executar a função
DROP TRIGGER IF EXISTS ensure_single_principal_address_trigger ON user_addresses;
CREATE TRIGGER ensure_single_principal_address_trigger
  BEFORE UPDATE OF principal ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_principal_address();

-- 5. Criar trigger para novos endereços principais
DROP TRIGGER IF EXISTS ensure_single_principal_address_insert_trigger ON user_addresses;
CREATE TRIGGER ensure_single_principal_address_insert_trigger
  BEFORE INSERT ON user_addresses
  FOR EACH ROW
  WHEN (NEW.principal = true)
  EXECUTE FUNCTION ensure_single_principal_address();
