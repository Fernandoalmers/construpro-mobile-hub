
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
    return profile;
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
    return profile;
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
    return profile;
  } catch (error) {
    console.error('[createUserProfile] Unexpected error:', error);
    throw error;
  }
};
