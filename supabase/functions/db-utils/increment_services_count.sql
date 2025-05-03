
CREATE OR REPLACE FUNCTION public.increment_services_count(prof_id UUID) 
RETURNS VOID AS $$
BEGIN
  UPDATE professionals 
  SET servicos_realizados = COALESCE(servicos_realizados, 0) + 1
  WHERE id = prof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
