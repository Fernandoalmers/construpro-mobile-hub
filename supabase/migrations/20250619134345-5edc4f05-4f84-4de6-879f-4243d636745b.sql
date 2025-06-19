
-- Adicionar campos para controle de promoções com temporizador
ALTER TABLE produtos 
ADD COLUMN promocao_inicio timestamp with time zone,
ADD COLUMN promocao_fim timestamp with time zone,
ADD COLUMN promocao_ativa boolean DEFAULT false;

-- Criar índice para melhorar performance nas consultas de promoções ativas
CREATE INDEX idx_produtos_promocao_ativa ON produtos(promocao_ativa, promocao_fim) 
WHERE promocao_ativa = true;

-- Função para desativar promoções expiradas automaticamente
CREATE OR REPLACE FUNCTION update_expired_promotions()
RETURNS void AS $$
BEGIN
  UPDATE produtos 
  SET promocao_ativa = false 
  WHERE promocao_ativa = true 
    AND promocao_fim < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN produtos.promocao_inicio IS 'Data e hora de início da promoção';
COMMENT ON COLUMN produtos.promocao_fim IS 'Data e hora de fim da promoção';
COMMENT ON COLUMN produtos.promocao_ativa IS 'Indica se a promoção está ativa no momento';
