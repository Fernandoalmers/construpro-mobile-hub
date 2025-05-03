
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  papel?: string;
  tipo_perfil?: string;
  avatar?: string;
  saldo_pontos?: number;
  endereco_principal?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  is_admin?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
};

export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error("User not authenticated");
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return null;
  }
};
