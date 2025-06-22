
-- Habilitar Row Level Security nas tabelas vendor_delivery_zones e vendor_product_restrictions
ALTER TABLE public.vendor_delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_product_restrictions ENABLE ROW LEVEL SECURITY;

-- Políticas para vendor_delivery_zones
-- Vendors podem ver apenas suas próprias zonas de entrega
CREATE POLICY "Vendors can view their own delivery zones" 
  ON public.vendor_delivery_zones 
  FOR SELECT 
  USING (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Vendors podem criar suas próprias zonas de entrega
CREATE POLICY "Vendors can create their own delivery zones" 
  ON public.vendor_delivery_zones 
  FOR INSERT 
  WITH CHECK (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Vendors podem atualizar suas próprias zonas de entrega
CREATE POLICY "Vendors can update their own delivery zones" 
  ON public.vendor_delivery_zones 
  FOR UPDATE 
  USING (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Vendors podem deletar suas próprias zonas de entrega
CREATE POLICY "Vendors can delete their own delivery zones" 
  ON public.vendor_delivery_zones 
  FOR DELETE 
  USING (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Admins podem acessar todas as zonas de entrega
CREATE POLICY "Admins can manage all delivery zones" 
  ON public.vendor_delivery_zones 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Políticas para vendor_product_restrictions
-- Vendors podem ver apenas suas próprias restrições de produto
CREATE POLICY "Vendors can view their own product restrictions" 
  ON public.vendor_product_restrictions 
  FOR SELECT 
  USING (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Vendors podem criar suas próprias restrições de produto
CREATE POLICY "Vendors can create their own product restrictions" 
  ON public.vendor_product_restrictions 
  FOR INSERT 
  WITH CHECK (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Vendors podem atualizar suas próprias restrições de produto
CREATE POLICY "Vendors can update their own product restrictions" 
  ON public.vendor_product_restrictions 
  FOR UPDATE 
  USING (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Vendors podem deletar suas próprias restrições de produto
CREATE POLICY "Vendors can delete their own product restrictions" 
  ON public.vendor_product_restrictions 
  FOR DELETE 
  USING (vendor_id IN (
    SELECT id FROM public.vendedores WHERE usuario_id = auth.uid()
  ));

-- Admins podem acessar todas as restrições de produto
CREATE POLICY "Admins can manage all product restrictions" 
  ON public.vendor_product_restrictions 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Permitir acesso público à função de verificação de restrições de entrega
-- (necessário para que clientes possam verificar disponibilidade de entrega)
CREATE POLICY "Public can check delivery restrictions" 
  ON public.vendor_product_restrictions 
  FOR SELECT 
  USING (true);

-- Criar política adicional para permitir leitura das zonas de entrega para verificação de entrega
CREATE POLICY "Public can read delivery zones for delivery checks" 
  ON public.vendor_delivery_zones 
  FOR SELECT 
  USING (active = true);
