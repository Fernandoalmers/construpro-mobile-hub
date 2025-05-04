
import { supabase } from '@/integrations/supabase/client';

export async function trackProductView(productId: string): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    // Create or update recently viewed entry
    await supabase
      .from('recently_viewed')
      .upsert({
        user_id: userData.user.id,
        produto_id: productId,
        data_visualizacao: new Date().toISOString()
      })
      .select();

  } catch (error) {
    console.error('Error tracking product view:', error);
  }
}
