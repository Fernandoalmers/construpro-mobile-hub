
import { supabase } from "@/integrations/supabase/client";

export interface UserAddress {
  id: string;
  user_id: string;
  nome: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  papel?: string;
  saldo_pontos?: number;
  avatar?: string;
  codigo?: string;
  endereco_principal?: any;
}

// Get user profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

// Get user addresses
export const getUserAddresses = async (): Promise<UserAddress[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return [];
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('principal', { ascending: false });

    if (error) {
      console.error('Error fetching user addresses:', error);
      return [];
    }

    return data as UserAddress[];
  } catch (error) {
    console.error('Error in getUserAddresses:', error);
    return [];
  }
};

// Add user address
export const addUserAddress = async (address: Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserAddress | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // If this is the first address or marked as principal, unmark other principals
    if (address.principal) {
      await supabase
        .from('user_addresses')
        .update({ principal: false })
        .eq('user_id', userData.user.id);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        ...address,
        user_id: userData.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding user address:', error);
      return null;
    }

    return data as UserAddress;
  } catch (error) {
    console.error('Error in addUserAddress:', error);
    return null;
  }
};

// Update user address
export const updateUserAddress = async (id: string, updates: Partial<Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserAddress | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    // If this address is being marked as principal, unmark other principals
    if (updates.principal) {
      await supabase
        .from('user_addresses')
        .update({ principal: false })
        .eq('user_id', userData.user.id)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userData.user.id)  // Extra safety check
      .select()
      .single();

    if (error) {
      console.error('Error updating user address:', error);
      return null;
    }

    return data as UserAddress;
  } catch (error) {
    console.error('Error in updateUserAddress:', error);
    return null;
  }
};

// Delete user address
export const deleteUserAddress = async (id: string): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userData.user.id);  // Extra safety check

    if (error) {
      console.error('Error deleting user address:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserAddress:', error);
    return false;
  }
};
