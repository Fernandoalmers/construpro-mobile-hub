
-- Habilitar Row Level Security na tabela user_delivery_context
ALTER TABLE public.user_delivery_context ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios dados de contexto de entrega
CREATE POLICY "Users can view their own delivery context" 
ON public.user_delivery_context 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Política para permitir que usuários insiram apenas seus próprios dados
CREATE POLICY "Users can insert their own delivery context" 
ON public.user_delivery_context 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
);

-- Política para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Users can update their own delivery context" 
ON public.user_delivery_context 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Política para permitir que usuários deletem apenas seus próprios dados
CREATE POLICY "Users can delete their own delivery context" 
ON public.user_delivery_context 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Política para administradores terem acesso completo
CREATE POLICY "Admins can manage all delivery contexts" 
ON public.user_delivery_context 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
