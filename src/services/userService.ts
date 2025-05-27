
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  papel?: string;
  tipo_perfil?: string;
  especialidade_profissional?: string;
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
      console.warn("🚫 [getUserProfile] User not authenticated");
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      console.error("❌ [getUserProfile] Error fetching user profile:", error.message);
      return null;
    }

    console.log(`✅ [getUserProfile] Retrieved profile for user: ${userData.user.id}`);
    return profile as UserProfile;
  } catch (error) {
    console.error("❌ [getUserProfile] Exception:", error);
    return null;
  }
};

export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error("🚫 [updateUserProfile] User not authenticated");
      throw new Error("Usuário não autenticado");
    }

    console.log(`🔧 [updateUserProfile] Updating profile for user: ${userData.user.id}`, profileData);

    // CRÍTICO: Remover qualquer tentativa de alterar is_admin
    if ('is_admin' in profileData) {
      console.error("🚫 [updateUserProfile] Unauthorized attempt to change admin status");
      delete profileData.is_admin;
      throw new Error("Alteração de privilégios administrativos não permitida");
    }

    // Get current session for auth token
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error("Sessão não encontrada");
    }

    // First try using the edge function with improved error handling
    try {
      const response = await fetch("https://orqnibkshlapwhjjmszh.supabase.co/functions/v1/profile-update", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [updateUserProfile] Profile updated via edge function:", result);
        return result.data as UserProfile;
      } else {
        const errorText = await response.text();
        console.warn("⚠️ [updateUserProfile] Edge function failed:", response.status, errorText);
        throw new Error(`Edge function failed: ${response.status}`);
      }
    } catch (edgeFunctionError) {
      console.warn("⚠️ [updateUserProfile] Edge function error, falling back to direct update:", edgeFunctionError);
      
      // Fallback to direct update with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', userData.user.id)
            .select()
            .single();

          if (error) {
            console.error(`❌ [updateUserProfile] Direct update error (attempt ${retryCount + 1}):`, error);
            if (retryCount === maxRetries - 1) {
              throw new Error(`Falha ao atualizar perfil: ${error.message}`);
            }
            retryCount++;
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }

          console.log("✅ [updateUserProfile] Profile updated successfully via direct update:", data);
          return data as UserProfile;
        } catch (directError) {
          console.error(`❌ [updateUserProfile] Direct update attempt ${retryCount + 1} failed:`, directError);
          if (retryCount === maxRetries - 1) {
            throw directError;
          }
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    throw new Error("Todas as tentativas de atualização falharam");
  } catch (error) {
    console.error("❌ [updateUserProfile] Error:", error);
    throw error; // Re-throw to allow proper error handling in the calling component
  }
};
