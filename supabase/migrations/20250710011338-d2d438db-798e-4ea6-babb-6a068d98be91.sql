-- Fix critical ZIP cache RLS security vulnerability
-- Remove dangerous policies that allow any authenticated user to modify cache data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow authenticated insert to zip_cache" ON public.zip_cache;
DROP POLICY IF EXISTS "Allow authenticated update to zip_cache" ON public.zip_cache;

-- Create secure service-only policies for data modification
CREATE POLICY "Allow service role to insert zip cache data" ON public.zip_cache
  FOR INSERT WITH CHECK (
    -- Only allow inserts from service role or through secure functions
    auth.jwt() ->> 'role' = 'service_role' OR 
    current_setting('role') = 'service_role'
  );

CREATE POLICY "Allow service role to update zip cache data" ON public.zip_cache
  FOR UPDATE USING (
    -- Only allow updates from service role or through secure functions
    auth.jwt() ->> 'role' = 'service_role' OR 
    current_setting('role') = 'service_role'
  );

-- Keep read access public as needed for functionality
-- (The existing "Allow public read access to zip_cache" policy remains)

-- Add data validation constraints to prevent malicious data
ALTER TABLE public.zip_cache 
ADD CONSTRAINT zip_cache_cep_format CHECK (
  cep ~ '^[0-9]{8}$' AND length(cep) = 8
);

ALTER TABLE public.zip_cache 
ADD CONSTRAINT zip_cache_uf_valid CHECK (
  uf IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO')
);

-- Create secure function for CEP lookups with validation
CREATE OR REPLACE FUNCTION public.secure_insert_zip_cache(
  p_cep text,
  p_logradouro text DEFAULT NULL,
  p_bairro text DEFAULT NULL,
  p_localidade text DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_ibge text DEFAULT NULL,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_cep text;
BEGIN
  -- Validate and clean CEP input
  clean_cep := regexp_replace(p_cep, '[^0-9]', '', 'g');
  
  -- Validate CEP format
  IF length(clean_cep) != 8 OR NOT (clean_cep ~ '^[0-9]{8}$') THEN
    RETURN false;
  END IF;
  
  -- Validate UF if provided
  IF p_uf IS NOT NULL AND p_uf NOT IN ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO') THEN
    RETURN false;
  END IF;
  
  -- Insert or update cache data
  INSERT INTO public.zip_cache (
    cep, logradouro, bairro, localidade, uf, ibge, latitude, longitude, cached_at
  ) VALUES (
    clean_cep, p_logradouro, p_bairro, p_localidade, p_uf, p_ibge, p_latitude, p_longitude, now()
  )
  ON CONFLICT (cep) DO UPDATE SET
    logradouro = EXCLUDED.logradouro,
    bairro = EXCLUDED.bairro,
    localidade = EXCLUDED.localidade,
    uf = EXCLUDED.uf,
    ibge = EXCLUDED.ibge,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    cached_at = now();
    
  -- Log security event for monitoring
  INSERT INTO public.security_events (event_type, details, user_id)
  VALUES (
    'zip_cache_update',
    jsonb_build_object(
      'cep', clean_cep,
      'timestamp', now(),
      'ip_address', inet_client_addr()
    ),
    auth.uid()
  );
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  -- Log failed attempts
  INSERT INTO public.security_events (event_type, details, user_id)
  VALUES (
    'zip_cache_insert_failed',
    jsonb_build_object(
      'error', SQLERRM,
      'cep_attempted', p_cep,
      'timestamp', now()
    ),
    auth.uid()
  );
  RETURN false;
END;
$$;

-- Grant execute permission to authenticated users for the secure function
GRANT EXECUTE ON FUNCTION public.secure_insert_zip_cache TO authenticated;