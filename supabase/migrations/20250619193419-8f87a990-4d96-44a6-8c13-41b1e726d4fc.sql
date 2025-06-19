
-- Criar tabela para zonas de entrega do vendedor
CREATE TABLE public.vendor_delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendedores(id) ON DELETE CASCADE,
  zone_name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('cep_range', 'cep_specific', 'ibge', 'cidade')),
  zone_value TEXT NOT NULL, -- CEP, faixa de CEP, código IBGE ou nome da cidade
  delivery_time TEXT NOT NULL DEFAULT 'até 7 dias úteis',
  delivery_fee NUMERIC DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para restrições de produtos por zona
CREATE TABLE public.vendor_product_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendedores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  delivery_zone_id UUID REFERENCES public.vendor_delivery_zones(id) ON DELETE CASCADE,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('cep_range', 'cep_specific', 'ibge', 'cidade')),
  zone_value TEXT NOT NULL,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('not_delivered', 'freight_on_demand', 'higher_fee')) DEFAULT 'freight_on_demand',
  restriction_message TEXT DEFAULT 'Frete a combinar para esta região',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_vendor_delivery_zones_vendor_id ON public.vendor_delivery_zones(vendor_id);
CREATE INDEX idx_vendor_delivery_zones_zone_type ON public.vendor_delivery_zones(zone_type, zone_value);
CREATE INDEX idx_vendor_product_restrictions_vendor_id ON public.vendor_product_restrictions(vendor_id);
CREATE INDEX idx_vendor_product_restrictions_product_id ON public.vendor_product_restrictions(product_id);
CREATE INDEX idx_vendor_product_restrictions_zone ON public.vendor_product_restrictions(zone_type, zone_value);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_vendor_delivery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vendor_delivery_zones_updated_at
  BEFORE UPDATE ON public.vendor_delivery_zones
  FOR EACH ROW EXECUTE FUNCTION update_vendor_delivery_updated_at();

CREATE TRIGGER trigger_vendor_product_restrictions_updated_at
  BEFORE UPDATE ON public.vendor_product_restrictions
  FOR EACH ROW EXECUTE FUNCTION update_vendor_delivery_updated_at();

-- Função para verificar se um produto tem restrições de entrega para um CEP específico
CREATE OR REPLACE FUNCTION check_product_delivery_restriction(
  p_vendor_id UUID,
  p_product_id UUID,
  p_customer_cep TEXT
)
RETURNS TABLE(
  has_restriction BOOLEAN,
  restriction_type TEXT,
  restriction_message TEXT,
  delivery_available BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH cep_clean AS (
    SELECT regexp_replace(p_customer_cep, '[^0-9]', '', 'g') as clean_cep
  ),
  restrictions AS (
    SELECT 
      r.restriction_type,
      r.restriction_message,
      CASE 
        WHEN r.zone_type = 'cep_specific' THEN 
          (SELECT clean_cep FROM cep_clean) = regexp_replace(r.zone_value, '[^0-9]', '', 'g')
        WHEN r.zone_type = 'cep_range' THEN
          -- Format: "01000000-01999999" ou "01000-01999"
          (SELECT clean_cep::INTEGER FROM cep_clean) BETWEEN 
            regexp_replace(split_part(r.zone_value, '-', 1), '[^0-9]', '', 'g')::INTEGER AND
            regexp_replace(split_part(r.zone_value, '-', 2), '[^0-9]', '', 'g')::INTEGER
        WHEN r.zone_type = 'ibge' THEN
          EXISTS (
            SELECT 1 FROM public.zip_cache z 
            WHERE z.cep = (SELECT clean_cep FROM cep_clean) 
            AND z.ibge = r.zone_value
          )
        ELSE false
      END as matches
    FROM public.vendor_product_restrictions r
    WHERE r.vendor_id = p_vendor_id 
    AND r.product_id = p_product_id 
    AND r.active = true
  )
  SELECT 
    COALESCE(bool_or(r.matches), false) as has_restriction,
    COALESCE(string_agg(r.restriction_type, ', ') FILTER (WHERE r.matches), '') as restriction_type,
    COALESCE(string_agg(r.restriction_message, '; ') FILTER (WHERE r.matches), '') as restriction_message,
    NOT COALESCE(bool_or(r.matches AND r.restriction_type = 'not_delivered'), false) as delivery_available
  FROM restrictions r;
END;
$$;
