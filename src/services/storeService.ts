
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';

interface StoreData {
  nome: string;
  descricao: string;
  endereco?: {
    logradouro: string;
    cidade: string;
    estado: string;
    cep: string;
    full_address: string;
  };
  operating_hours?: any;
  profile_id: string;
}

export interface Store {
  id: string;
  nome: string;
  descricao?: string;
  logo_url?: string;
  banner_url?: string;
  endereco: any;
  profile_id: string;
  created_at?: string;
  updated_at?: string;
}

// Save or update store
export const saveStore = async (storeData: StoreData): Promise<Store | null> => {
  try {
    // Check if store already exists for this profile
    const { data: existingStores } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', storeData.profile_id);
    
    let result;
    
    if (existingStores && existingStores.length > 0) {
      // Update existing store
      const { data, error } = await supabase
        .from('vendedores')
        .update({
          nome_loja: storeData.nome,
          descricao: storeData.descricao,
        })
        .eq('usuario_id', storeData.profile_id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new store
      const { data, error } = await supabase
        .from('vendedores')
        .insert({
          usuario_id: storeData.profile_id,
          nome_loja: storeData.nome,
          descricao: storeData.descricao,
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    // Map the vendedores data to the Store interface
    return {
      id: result.id,
      nome: result.nome_loja,
      descricao: result.descricao,
      logo_url: result.logo,
      banner_url: result.banner,
      endereco: {},  // No direct address in vendedores table
      profile_id: result.usuario_id,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  } catch (error) {
    console.error('Error in saveStore:', error);
    return null;
  }
};

// Get store by ID
export const getStoreById = async (storeId: string): Promise<Store | null> => {
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', storeId)
      .single();
    
    if (error) throw error;
    
    // Map the vendedores data to the Store interface
    return {
      id: data.id,
      nome: data.nome_loja,
      descricao: data.descricao,
      logo_url: data.logo,
      banner_url: data.banner,
      endereco: {},  // No direct address in vendedores table
      profile_id: data.usuario_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error in getStoreById:', error);
    return null;
  }
};

// Get store by profile ID
export const getStoreByProfileId = async (profileId: string): Promise<Store | null> => {
  try {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('usuario_id', profileId)
      .single();
    
    if (error) throw error;
    
    // Map the vendedores data to the Store interface
    return {
      id: data.id,
      nome: data.nome_loja,
      descricao: data.descricao,
      logo_url: data.logo,
      banner_url: data.banner,
      endereco: {},  // No direct address in vendedores table
      profile_id: data.usuario_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error in getStoreByProfileId:', error);
    return null;
  }
};

// Upload store image (logo or banner)
export const uploadStoreImage = async (
  storeId: string,
  file: File,
  type: 'logo' | 'banner'
): Promise<string | null> => {
  try {
    const fileName = `${type}-${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const filePath = `stores/${storeId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('store-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('store-images')
      .getPublicUrl(filePath);
      
    const imageUrl = data.publicUrl;
    
    // Update store with new image URL
    const fieldToUpdate = type === 'logo' ? 'logo' : 'banner';
    
    const { error: updateError } = await supabase
      .from('vendedores')
      .update({ [fieldToUpdate]: imageUrl })
      .eq('id', storeId);
    
    if (updateError) throw updateError;
    
    return imageUrl;
  } catch (error) {
    console.error(`Error uploading ${type}:`, error);
    return null;
  }
};
