
-- Create the resolve_delivery_zones function if it doesn't exist
CREATE OR REPLACE FUNCTION public.resolve_delivery_zones(user_cep text)
RETURNS TABLE(
  zone_id uuid,
  vendor_id uuid,
  zone_name text,
  delivery_fee numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Simple implementation that returns vendor delivery zones based on CEP
  -- This is a basic version - can be enhanced later with proper zone matching
  RETURN QUERY
  SELECT 
    vdz.id as zone_id,
    vdz.vendor_id,
    vdz.zone_name,
    vdz.delivery_fee
  FROM vendor_delivery_zones vdz
  WHERE vdz.active = true
  AND (
    vdz.zone_type = 'cep_specific' AND vdz.zone_value = regexp_replace(user_cep, '[^0-9]', '', 'g')
    OR vdz.zone_type = 'cep_range' AND 
       regexp_replace(user_cep, '[^0-9]', '', 'g')::INTEGER BETWEEN 
       regexp_replace(split_part(vdz.zone_value, '-', 1), '[^0-9]', '', 'g')::INTEGER AND
       regexp_replace(split_part(vdz.zone_value, '-', 2), '[^0-9]', '', 'g')::INTEGER
    OR vdz.zone_type = 'city' -- Add basic city matching later
  );
  
  -- If no specific zones found, return empty result
  -- This prevents the system from breaking when no zones are configured
END;
$$;
