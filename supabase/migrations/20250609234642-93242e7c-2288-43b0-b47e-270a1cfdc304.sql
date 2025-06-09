
-- Criar o bucket 'product-images' para armazenar imagens de produtos e segmentos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Políticas de storage para o bucket product-images

-- Política para permitir SELECT (visualização) pública
CREATE POLICY "Public read access for product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Política para permitir INSERT (upload) para usuários autenticados
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);

-- Política para permitir UPDATE para usuários autenticados (para seus próprios uploads)
CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);

-- Política para permitir DELETE para usuários autenticados (para seus próprios uploads)
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid() IS NOT NULL
);
