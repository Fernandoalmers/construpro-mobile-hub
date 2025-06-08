
import { supabase } from "@/integrations/supabase/client";

export interface Favorite {
  id: string;
  user_id: string;
  produto_id: string;
  data_adicionado: string;
  produto?: any;
}

// Get user favorites
export const getUserFavorites = async (): Promise<Favorite[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return [];
    }

    console.log('Fetching favorites for user:', userData.user.id);

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        produtos:produto_id (
          *,
          vendedores:vendedor_id (nome_loja, logo)
        )
      `)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    console.log('Favorites fetched:', data);
    return data.map(fav => ({
      id: fav.id,
      user_id: fav.user_id,
      produto_id: fav.produto_id,
      data_adicionado: fav.data_adicionado,
      produto: fav.produtos
    }));
  } catch (error) {
    console.error('Error in getUserFavorites:', error);
    return [];
  }
};

// Add product to favorites
export const addToFavorites = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    console.log('Adding to favorites - Product:', productId, 'User:', userData.user.id);

    // Check if already favorited
    const { data: existingFav } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('produto_id', productId)
      .maybeSingle();

    if (existingFav) {
      console.log('Product already favorited');
      return true; // Already favorited
    }

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

    console.log('Successfully added to favorites');
    return true;
  } catch (error) {
    console.error('Error in addToFavorites:', error);
    return false;
  }
};

// Remove from favorites
export const removeFromFavorites = async (productId: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    console.log('Removing from favorites - Product:', productId, 'User:', userData.user.id);

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('produto_id', productId);

    if (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }

    console.log('Successfully removed from favorites');
    return true;
  } catch (error) {
    console.error('Error in removeFromFavorites:', error);
    return false;
  }
};

// Check if a product is favorited
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
    console.error('Error in isProductFavorited:', error);
    return false;
  }
};
