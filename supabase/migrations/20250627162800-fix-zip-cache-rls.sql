
-- Fix RLS policies for zip_cache table to allow public access
-- This resolves the 401 errors when trying to cache CEP data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read zip cache" ON public.zip_cache;
DROP POLICY IF EXISTS "Authenticated users can insert zip cache" ON public.zip_cache;

-- Create more permissive policies for zip cache operations
CREATE POLICY "Allow public read access to zip cache" 
ON public.zip_cache FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow public insert to zip cache" 
ON public.zip_cache FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow public update to zip cache" 
ON public.zip_cache FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.zip_cache TO anon;
GRANT SELECT, INSERT, UPDATE ON public.zip_cache TO authenticated;

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_zip_cache_cep ON public.zip_cache(cep);
CREATE INDEX IF NOT EXISTS idx_zip_cache_localidade ON public.zip_cache(localidade);
