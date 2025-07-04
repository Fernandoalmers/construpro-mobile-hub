-- Fix favorites foreign key constraint to point to correct table
-- Drop the incorrect constraint that points to products table
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_produto_id_fkey;

-- Add correct constraint pointing to produtos table
ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE CASCADE;