
-- Criar tabela para cupons promocionais (cupons que aparecerão na página "Meus Cupons")
CREATE TABLE public.promotional_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  featured BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coupon_id) -- Um cupom só pode ser promocional uma vez
);

-- Criar índices para performance
CREATE INDEX idx_promotional_coupons_featured ON public.promotional_coupons(featured);
CREATE INDEX idx_promotional_coupons_display_order ON public.promotional_coupons(display_order);
CREATE INDEX idx_promotional_coupons_coupon_id ON public.promotional_coupons(coupon_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_promotional_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotional_coupons_updated_at
  BEFORE UPDATE ON public.promotional_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_coupons_updated_at();

-- Habilitar RLS
ALTER TABLE public.promotional_coupons ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem cupons promocionais ativos
CREATE POLICY "Users can view active promotional coupons" ON public.promotional_coupons
  FOR SELECT USING (featured = true);

-- Política para admins gerenciarem cupons promocionais
CREATE POLICY "Admins can manage promotional coupons" ON public.promotional_coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
