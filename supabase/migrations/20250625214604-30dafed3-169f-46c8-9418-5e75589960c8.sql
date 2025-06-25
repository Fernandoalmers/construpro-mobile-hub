
-- Adicionar índices para performance na tabela vendor_delivery_zones
CREATE INDEX IF NOT EXISTS idx_vendor_delivery_zones_zone_lookup 
ON vendor_delivery_zones(zone_type, zone_value, vendor_id) 
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_vendor_delivery_zones_vendor_active 
ON vendor_delivery_zones(vendor_id) 
WHERE active = true;

-- Criar tabela para contexto de entrega do usuário
CREATE TABLE IF NOT EXISTS user_delivery_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  session_id TEXT, -- Para usuários não autenticados
  current_cep TEXT NOT NULL,
  current_city TEXT,
  current_state TEXT,
  resolved_zone_ids UUID[] DEFAULT '{}',
  last_resolved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para a nova tabela
CREATE INDEX IF NOT EXISTS idx_user_delivery_context_user 
ON user_delivery_context(user_id);

CREATE INDEX IF NOT EXISTS idx_user_delivery_context_session 
ON user_delivery_context(session_id);

CREATE INDEX IF NOT EXISTS idx_user_delivery_context_cep 
ON user_delivery_context(current_cep);

-- Função para resolver zonas de entrega baseado no CEP
CREATE OR REPLACE FUNCTION resolve_delivery_zones(user_cep TEXT)
RETURNS TABLE(zone_id UUID, vendor_id UUID, zone_name TEXT, delivery_fee NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_cep TEXT;
BEGIN
  -- Limpar o CEP (apenas números)
  clean_cep := regexp_replace(user_cep, '[^0-9]', '', 'g');
  
  -- Retornar zonas que atendem este CEP
  RETURN QUERY
  SELECT 
    vdz.id as zone_id,
    vdz.vendor_id,
    vdz.zone_name,
    vdz.delivery_fee
  FROM vendor_delivery_zones vdz
  WHERE vdz.active = true
  AND (
    -- CEP específico
    (vdz.zone_type = 'cep_specific' AND clean_cep = regexp_replace(vdz.zone_value, '[^0-9]', '', 'g'))
    OR
    -- Faixa de CEP
    (vdz.zone_type = 'cep_range' AND 
     clean_cep::INTEGER BETWEEN 
     regexp_replace(split_part(vdz.zone_value, '-', 1), '[^0-9]', '', 'g')::INTEGER AND
     regexp_replace(split_part(vdz.zone_value, '-', 2), '[^0-9]', '', 'g')::INTEGER)
    OR
    -- Por código IBGE (via zip_cache)
    (vdz.zone_type = 'ibge' AND 
     EXISTS(SELECT 1 FROM zip_cache zc WHERE zc.cep = clean_cep AND zc.ibge = vdz.zone_value))
    OR
    -- Por cidade (via zip_cache)
    (vdz.zone_type = 'cidade' AND
     EXISTS(SELECT 1 FROM zip_cache zc WHERE zc.cep = clean_cep AND 
            UPPER(zc.localidade || '-' || zc.uf) = UPPER(vdz.zone_value)))
  );
END;
$$;

-- Trigger para atualizar updated_at na tabela user_delivery_context
CREATE OR REPLACE FUNCTION update_delivery_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_delivery_context_updated_at
  BEFORE UPDATE ON user_delivery_context
  FOR EACH ROW EXECUTE FUNCTION update_delivery_context_timestamp();
