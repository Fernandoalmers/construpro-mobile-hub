
import { supabase } from "@/integrations/supabase/client";

// Add to favorites
export const addToFavorites = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    // Check if already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('produto_id', productId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking favorite status:', checkError);
      return false;
    }

    // Don't add if already favorited
    if (existingFavorite) {
      return true;
    }

    // Add to favorites
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userData.user.id,
        produto_id: productId
      });

    if (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

// Check if product is favorited
export const isProductFavorited = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return false;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('produto_id', productId)
      .maybeSingle();

    if (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking if product is favorited:', error);
    return false;
  }
};

// Get user favorites
export const getFavorites = async (): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        data_adicionado,
        produtos:produto_id (
          id,
          nome,
          descricao,
          preco_normal,
          preco_promocional,
          imagem_url,
          categoria,
          avaliacao,
          stores:vendedor_id ( nome, id )
        )
      `)
      .eq('user_id', userData.user.id)
      .order('data_adicionado', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    // Process to match expected format with proper type checking
    const processedData = (data || []).map(item => {
      // First check if produtos exists and is a valid object
      if (item.produtos && typeof item.produtos === 'object') {
        // Now it's safe to access properties with proper null checks
        const preco = item.produtos?.preco_promocional || item.produtos?.preco_normal;
        
        return {
          ...item,
          produtos: {
            ...item.produtos,
            preco
          }
        };
      }
      // If produtos is not valid, return item as is without transformation
      return item;
    });

    return processedData;
  } catch (error) {
    console.error('Error in getFavorites:', error);
    return [];
  }
};
