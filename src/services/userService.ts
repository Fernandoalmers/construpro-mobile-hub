
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
  codigo?: string;
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

    console.log("Retrieved user profile:", profile);
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

    console.log("Updating profile with data:", profileData);

    // First try using the edge function if available
    try {
      // Use the correct way to access the Supabase URL
      const response = await fetch("https://orqnibkshlapwhjjmszh.supabase.co/functions/v1/profile-update", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Profile updated via edge function:", result);
        return result.data as UserProfile;
      } else {
        console.warn("Edge function failed, falling back to direct update:", await response.text());
      }
    } catch (edgeFunctionError) {
      console.warn("Error using edge function for profile update, falling back to direct update:", edgeFunctionError);
    }

    // Fallback to direct update
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

    console.log("Profile updated successfully:", data);
    return data as UserProfile;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return null;
  }
};
