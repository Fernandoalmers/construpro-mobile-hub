import { supabase } from '@/integrations/supabase/client';

export interface ReviewSubmission {
  productId: string;
  rating: number;
  comment: string;
}

export const submitReview = async (productId: string, rating: number, comment: string): Promise<void> => {
  // Verificar se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se o usuário já avaliou este produto
  const { data: existingReview, error: checkError } = await supabase
    .from('product_reviews')
    .select('id')
    .eq('produto_id', productId)
    .eq('cliente_id', user.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Erro ao verificar avaliação existente:', checkError);
    throw new Error('Erro ao verificar avaliações existentes');
  }

  if (existingReview) {
    throw new Error('Você já avaliou este produto');
  }

  // Validação dos dados
  if (rating < 1 || rating > 5) {
    throw new Error('A nota deve estar entre 1 e 5');
  }

  if (comment.trim().length < 10) {
    throw new Error('O comentário deve ter pelo menos 10 caracteres');
  }

  if (comment.trim().length > 500) {
    throw new Error('O comentário deve ter no máximo 500 caracteres');
  }

  // Inserir a avaliação
  const { error: insertError } = await supabase
    .from('product_reviews')
    .insert([
      {
        produto_id: productId,
        cliente_id: user.id,
        nota: rating,
        comentario: comment.trim(),
        data: new Date().toISOString()
      }
    ]);

  if (insertError) {
    console.error('Erro ao inserir avaliação:', insertError);
    throw new Error('Erro ao salvar avaliação');
  }
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  // Verificar se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  // Verificar se a avaliação existe e pertence ao usuário
  const { data: existingReview, error: checkError } = await supabase
    .from('product_reviews')
    .select('id, cliente_id')
    .eq('id', reviewId)
    .single();

  if (checkError) {
    console.error('Erro ao verificar avaliação:', checkError);
    throw new Error('Avaliação não encontrada');
  }

  if (existingReview.cliente_id !== user.id) {
    throw new Error('Você só pode excluir suas próprias avaliações');
  }

  // Deletar a avaliação
  const { error: deleteError } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId);

  if (deleteError) {
    console.error('Erro ao excluir avaliação:', deleteError);
    throw new Error('Erro ao excluir avaliação');
  }
};

export const canUserReviewProduct = async (productId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Verificar se o usuário já avaliou este produto
    const { data: existingReview, error } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('produto_id', productId)
      .eq('cliente_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar permissão de avaliação:', error);
      return false;
    }

    // Se não existe avaliação, o usuário pode avaliar
    return !existingReview;
  } catch (error) {
    console.error('Erro ao verificar permissão de avaliação:', error);
    return false;
  }
};