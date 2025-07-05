-- Create data masking functions for customer security
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF cpf_value IS NULL OR length(cpf_value) < 11 THEN
    RETURN cpf_value;
  END IF;
  
  -- Format: 123***.***.**-**
  RETURN substring(cpf_value, 1, 3) || '***.***.**-**';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  local_part text;
  domain_part text;
  at_position integer;
BEGIN
  IF email_value IS NULL OR position('@' in email_value) = 0 THEN
    RETURN email_value;
  END IF;
  
  at_position := position('@' in email_value);
  local_part := substring(email_value, 1, at_position - 1);
  domain_part := substring(email_value, at_position);
  
  -- Show first 3 characters, mask the rest with ***
  IF length(local_part) <= 3 THEN
    RETURN local_part || '***' || domain_part;
  ELSE
    RETURN substring(local_part, 1, 3) || '***' || domain_part;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits text;
BEGIN
  IF phone_value IS NULL THEN
    RETURN phone_value;
  END IF;
  
  -- Extract only digits
  digits := regexp_replace(phone_value, '[^0-9]', '', 'g');
  
  IF length(digits) = 11 THEN
    -- Format: (11) 9****-****
    RETURN '(' || substring(digits, 1, 2) || ') ' || substring(digits, 3, 1) || '****-****';
  ELSIF length(digits) = 10 THEN
    -- Format: (11) ****-****
    RETURN '(' || substring(digits, 1, 2) || ') ****-****';
  ELSE
    -- For other formats, mask most digits
    RETURN regexp_replace(phone_value, '[0-9]', '*', 'g');
  END IF;
END;
$$;

-- Update the search_profiles_for_vendor function to require 6 characters and mask sensitive data
CREATE OR REPLACE FUNCTION public.search_profiles_for_vendor(search_query text)
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  telefone text,
  cpf text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_id uuid;
  vendor_record RECORD;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Validate search query length (minimum 6 characters)
  IF search_query IS NULL OR length(trim(search_query)) < 6 THEN
    RAISE EXCEPTION 'Search query must have at least 6 characters';
  END IF;
  
  -- Check if user is a registered and active vendor
  SELECT * INTO vendor_record
  FROM vendedores v
  WHERE v.usuario_id = current_user_id
    AND v.status = 'ativo';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User is not a registered vendor or not active or approved';
  END IF;
  
  -- Search profiles with masked sensitive data
  RETURN QUERY
  SELECT 
    p.id,
    p.nome,
    mask_email(p.email) as email,
    mask_phone(p.telefone) as telefone,
    mask_cpf(p.cpf) as cpf
  FROM profiles p
  WHERE p.status = 'ativo'
    AND (
      p.nome ILIKE '%' || search_query || '%'
      OR p.email ILIKE '%' || search_query || '%'
      OR p.telefone ILIKE '%' || search_query || '%'
      OR p.cpf ILIKE '%' || search_query || '%'
    )
  ORDER BY p.nome
  LIMIT 20;
END;
$$;