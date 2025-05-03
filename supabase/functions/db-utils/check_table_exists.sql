
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = check_table_exists.table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Helper function to get rewards data
CREATE OR REPLACE FUNCTION public.get_rewards()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.check_table_exists('recompensas') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT row_to_json(r) FROM (
    SELECT * FROM public.recompensas
    ORDER BY created_at DESC
  ) r;
END;
$$;

-- Helper function to get reward categories
CREATE OR REPLACE FUNCTION public.get_reward_categories()
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.check_table_exists('recompensas') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT DISTINCT categoria FROM public.recompensas
  WHERE categoria IS NOT NULL
  ORDER BY categoria;
END;
$$;
