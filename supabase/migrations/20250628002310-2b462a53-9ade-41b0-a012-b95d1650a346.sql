
-- Expandir a tabela site_settings para incluir favicon e logo variante
ALTER TABLE public.site_settings 
ADD COLUMN favicon_url TEXT,
ADD COLUMN favicon_filename TEXT,
ADD COLUMN logo_variant_url TEXT,
ADD COLUMN logo_variant_filename TEXT;

-- Comentário: Adicionando colunas para favicon e logo variante
-- favicon_url/favicon_filename: Para o favicon dinâmico do site
-- logo_variant_url/logo_variant_filename: Para a versão branca/laranja da logo
