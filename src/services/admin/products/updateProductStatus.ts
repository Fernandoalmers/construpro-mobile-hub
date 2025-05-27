
import { supabase } from '@/integrations/supabase/client';

export const updateProductStatus = async (productId: string, status: string) => {
  const { error } = await supabase
    .from('produtos')
    .update({ status })
    .eq('id', productId);

  if (error) {
    throw error;
  }
};
