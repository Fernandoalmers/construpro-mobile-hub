-- Corrigir a função handle_new_user para tratar CNPJ/CPF corretamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    nome, 
    email,
    telefone, 
    tipo_perfil, 
    papel,
    especialidade_profissional,
    cpf,
    cnpj,
    status,
    saldo_pontos,
    codigo
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'telefone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'tipo_perfil', 'consumidor'),
    COALESCE(NEW.raw_user_meta_data ->> 'papel', NEW.raw_user_meta_data ->> 'tipo_perfil', 'consumidor'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'tipo_perfil' = 'profissional' 
      THEN NEW.raw_user_meta_data ->> 'especialidade_profissional'
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'tipo_perfil' != 'lojista' 
      THEN NEW.raw_user_meta_data ->> 'cpf'
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'tipo_perfil' = 'lojista' 
      THEN NEW.raw_user_meta_data ->> 'cnpj'
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'status', 'ativo'),
    COALESCE((NEW.raw_user_meta_data ->> 'saldo_pontos')::integer, 0),
    NEW.raw_user_meta_data ->> 'codigo'
  );
  RETURN NEW;
END;
$$;