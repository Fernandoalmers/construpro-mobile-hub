
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  papel?: string;
  avatar?: string;
  codigo?: string;
  tipo_perfil?: string;
  status?: string;
  especialidade_profissional?: string;
  cnpj?: string;
  saldo_pontos?: number;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
  endereco_principal?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  favoritos?: string[];
  historico_navegacao?: string[];
}

// Helper function to safely parse endereco_principal
const parseEnderecosPrincipal = (endereco: any) => {
  if (!endereco) return undefined;
  
  // If it's already an object, return it
  if (typeof endereco === 'object' && endereco !== null) {
    return endereco;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof endereco === 'string') {
    try {
      return JSON.parse(endereco);
    } catch {
      return undefined;
    }
  }
  
  return undefined;
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('[getUserProfile] No authenticated user found');
      return null;
    }

    console.log('[getUserProfile] Fetching profile for user:', user.id);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[getUserProfile] Error fetching profile:', error);
      return null;
    }

    if (!profile) {
      console.log('[getUserProfile] No profile found for user');
      return null;
    }

    console.log('[getUserProfile] Profile fetched successfully:', profile);
    
    // Parse endereco_principal safely
    let parsedProfile: UserProfile = {
      ...profile,
      endereco_principal: parseEnderecosPrincipal(profile.endereco_principal)
    };

    // Se não há endereco_principal no perfil, buscar da tabela user_addresses como fallback
    if (!parsedProfile.endereco_principal) {
      console.log('[getUserProfile] No endereco_principal found, checking user_addresses');
      
      const { data: principalAddress, error: addressError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('principal', true)
        .single();

      if (!addressError && principalAddress) {
        console.log('[getUserProfile] Found principal address in user_addresses:', principalAddress);
        parsedProfile.endereco_principal = {
          logradouro: principalAddress.logradouro,
          numero: principalAddress.numero,
          complemento: principalAddress.complemento,
          bairro: principalAddress.bairro,
          cidade: principalAddress.cidade,
          estado: principalAddress.estado,
          cep: principalAddress.cep
        };
      }
    }
    
    return parsedProfile;
  } catch (error) {
    console.error('[getUserProfile] Unexpected error:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    console.log('[updateUserProfile] Updating profile for user:', user.id, updates);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('[updateUserProfile] Error updating profile:', error);
      throw error;
    }

    console.log('[updateUserProfile] Profile updated successfully:', profile);
    
    // Parse endereco_principal safely
    const parsedProfile: UserProfile = {
      ...profile,
      endereco_principal: parseEnderecosPrincipal(profile.endereco_principal)
    };
    
    return parsedProfile;
  } catch (error) {
    console.error('[updateUserProfile] Unexpected error:', error);
    throw error;
  }
};

export const createUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    console.log('[createUserProfile] Creating profile for user:', user.id, profileData);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('[createUserProfile] Error creating profile:', error);
      throw error;
    }

    console.log('[createUserProfile] Profile created successfully:', profile);
    
    // Parse endereco_principal safely
    const parsedProfile: UserProfile = {
      ...profile,
      endereco_principal: parseEnderecosPrincipal(profile.endereco_principal)
    };
    
    return parsedProfile;
  } catch (error) {
    console.error('[createUserProfile] Unexpected error:', error);
    throw error;
  }
};
