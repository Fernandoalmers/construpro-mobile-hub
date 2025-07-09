-- Add updated_at column to pedidos table and create auto-update trigger
ALTER TABLE public.pedidos 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Set updated_at for existing records to match created_at
UPDATE public.pedidos 
SET updated_at = COALESCE(created_at, now()) 
WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after setting values
ALTER TABLE public.pedidos 
ALTER COLUMN updated_at SET NOT NULL;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on pedidos table
CREATE TRIGGER update_pedidos_updated_at_trigger
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pedidos_updated_at();