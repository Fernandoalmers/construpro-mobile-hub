
-- Criar tabela para configurações do site (logo, etc.)
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  logo_url text,
  logo_filename text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir configuração inicial com a logo atual
INSERT INTO public.site_settings (logo_url, logo_filename) 
VALUES ('/lovable-uploads/7520caa6-efbb-4176-9c9f-8d37f88c7ff1.png', 'matershop-logo.png');

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública das configurações
CREATE POLICY "Site settings are publicly readable" 
  ON public.site_settings 
  FOR SELECT 
  TO public 
  USING (true);

-- Política para permitir apenas admins atualizarem
CREATE POLICY "Only admins can modify site settings" 
  ON public.site_settings 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Criar bucket de storage para logos (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de site-assets
CREATE POLICY "Site assets are publicly accessible" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update site assets" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete site assets" 
  ON storage.objects 
  FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'site-assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_site_settings_updated_at();
