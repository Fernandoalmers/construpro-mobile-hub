
-- Criar tabela para cache de CEP
CREATE TABLE public.zip_cache (
  cep VARCHAR(8) PRIMARY KEY,
  logradouro TEXT,
  bairro TEXT,
  localidade TEXT,
  uf VARCHAR(2),
  ibge VARCHAR(8),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campos de endereço na tabela vendedores
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(8);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_logradouro TEXT;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_bairro TEXT;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_cidade TEXT;
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_latitude DECIMAL(10,8);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS endereco_longitude DECIMAL(11,8);
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS zona_entrega TEXT DEFAULT 'outras';

-- Criar tabela para zonas de entrega
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_type TEXT NOT NULL, -- 'local', 'regional', 'outras'
  zone_name TEXT NOT NULL,
  ibge_code VARCHAR(8),
  cep_ranges TEXT[], -- Array de faixas de CEP
  delivery_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir zonas padrão
INSERT INTO public.delivery_zones (zone_type, zone_name, ibge_code, delivery_time) VALUES
('local', 'Capelinha/MG', '3112307', 'até 48h'),
('outras', 'Demais localidades', NULL, 'frete a combinar (informado após o fechamento do pedido)');

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.zip_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Política para zip_cache (leitura pública, escrita apenas para usuários autenticados)
CREATE POLICY "Public can read zip cache" ON public.zip_cache FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert zip cache" ON public.zip_cache FOR INSERT TO authenticated WITH CHECK (true);

-- Política para delivery_zones (leitura pública)
CREATE POLICY "Public can read delivery zones" ON public.delivery_zones FOR SELECT TO public USING (true);
