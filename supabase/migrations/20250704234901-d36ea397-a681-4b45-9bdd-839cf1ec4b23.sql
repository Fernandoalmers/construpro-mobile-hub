-- Alterar o campo estoque de integer para numeric para suportar valores fracionados
ALTER TABLE public.produtos ALTER COLUMN estoque TYPE numeric USING estoque::numeric;

-- Adicionar campo unidade_medida se não existir
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS unidade_medida text DEFAULT 'unidade';

-- Adicionar campo valor_conversao se não existir para produtos que precisam de conversão
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS valor_conversao numeric;

-- Adicionar campo controle_quantidade se não existir
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS controle_quantidade text DEFAULT 'livre' CHECK (controle_quantidade IN ('multiplo', 'livre'));

-- Atualizar produtos existentes com unidade_medida baseada no campo unidade_venda se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'unidade_venda') THEN
    UPDATE public.produtos SET unidade_medida = unidade_venda WHERE unidade_medida IS NULL;
  END IF;
END $$;