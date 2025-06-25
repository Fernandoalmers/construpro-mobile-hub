
-- Deletar entrada incorreta do CEP 39688-000
DELETE FROM zip_cache WHERE cep = '39688000';

-- Inserir dados corretos para Angelândia-MG
INSERT INTO zip_cache (
  cep,
  logradouro,
  bairro,
  localidade,
  uf,
  ibge,
  cached_at
) VALUES (
  '39688000',
  'Endereço não especificado',
  'Centro',
  'Angelândia',
  'MG',
  '3102803',
  now()
);
