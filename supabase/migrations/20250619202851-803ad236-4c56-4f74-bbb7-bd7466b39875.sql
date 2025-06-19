
-- Criar função para sincronizar endereço principal com o perfil do usuário
CREATE OR REPLACE FUNCTION sync_principal_address_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o endereço foi marcado como principal
  IF NEW.principal = true THEN
    -- Atualizar o campo endereco_principal na tabela profiles
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
  
  -- Se o endereço foi desmarcado como principal (e não há outro principal)
  IF OLD.principal = true AND NEW.principal = false THEN
    -- Verificar se há outro endereço principal para este usuário
    IF NOT EXISTS (
      SELECT 1 FROM user_addresses 
      WHERE user_id = NEW.user_id AND principal = true AND id != NEW.id
    ) THEN
      -- Se não há outro principal, limpar o endereco_principal do perfil
      UPDATE profiles 
      SET endereco_principal = null,
          updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função após UPDATE na tabela user_addresses
DROP TRIGGER IF EXISTS sync_principal_address_trigger ON user_addresses;
CREATE TRIGGER sync_principal_address_trigger
  AFTER UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION sync_principal_address_to_profile();

-- Criar trigger para executar a função após INSERT na tabela user_addresses (para novos endereços principais)
DROP TRIGGER IF EXISTS sync_principal_address_insert_trigger ON user_addresses;
CREATE TRIGGER sync_principal_address_insert_trigger
  AFTER INSERT ON user_addresses
  FOR EACH ROW
  WHEN (NEW.principal = true)
  EXECUTE FUNCTION sync_principal_address_to_profile();

-- Sincronizar dados existentes: atualizar profiles com endereços principais já existentes
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
  AND profiles.endereco_principal IS NULL;
