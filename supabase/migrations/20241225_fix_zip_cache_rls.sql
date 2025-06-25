
-- Remove existing RLS policies that might be causing issues
DROP POLICY IF EXISTS "Enable read access for all users" ON public.zip_cache;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.zip_cache;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.zip_cache;

-- Create simple RLS policies for zip_cache
CREATE POLICY "Allow public read access to zip_cache" ON public.zip_cache
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert to zip_cache" ON public.zip_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated update to zip_cache" ON public.zip_cache
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE public.zip_cache ENABLE ROW LEVEL SECURITY;
