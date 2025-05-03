
import { supabase } from "@/integrations/supabase/client";

export interface DayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface StoreAddress {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  full_address?: string;
}

export interface Store {
  id: string;
  nome: string;
  descricao?: string;
  logo_url?: string;
  endereco?: StoreAddress;
  contato?: string;
  owner_id?: string;
  profile_id?: string;
  operating_hours?: OperatingHours;
  created_at?: string;
  updated_at?: string;
}

// Get a store by ID
export const getStoreById = async (id: string): Promise<Store | null> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching store:', error);
    return null;
  }
  
  return data as Store;
};

// Get stores by owner
export const getStoresByOwner = async (profileId: string): Promise<Store[]> => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('profile_id', profileId);
    
  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
  
  return data as Store[];
};

// Create or update store
export const saveStore = async (store: Partial<Store>): Promise<Store | null> => {
  if (store.id) {
    // Update existing store
    const { data, error } = await supabase
      .from('stores')
      .update(store)
      .eq('id', store.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating store:', error);
      return null;
    }
    
    return data as Store;
  } else {
    // Create new store
    const { data, error } = await supabase
      .from('stores')
      .insert(store)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating store:', error);
      return null;
    }
    
    return data as Store;
  }
};

// Upload store image (logo or banner)
export const uploadStoreImage = async (
  storeId: string, 
  file: File, 
  type: 'logo' | 'banner'
): Promise<string | null> => {
  const path = `stores/${storeId}/${type}`;
  
  const { error } = await supabase.storage
    .from('store-images')
    .upload(path, file, { upsert: true });
    
  if (error) {
    console.error(`Error uploading ${type}:`, error);
    return null;
  }
  
  // Get public URL for image
  const { data } = supabase.storage
    .from('store-images')
    .getPublicUrl(path);
    
  return data.publicUrl;
};

// Update store image URL
export const updateStoreImageUrl = async (
  storeId: string, 
  imageUrl: string, 
  type: 'logo' | 'banner'
): Promise<boolean> => {
  const updateData = type === 'logo' 
    ? { logo_url: imageUrl } 
    : { banner_url: imageUrl };
  
  const { error } = await supabase
    .from('stores')
    .update(updateData)
    .eq('id', storeId);
    
  if (error) {
    console.error(`Error updating store ${type} URL:`, error);
    return false;
  }
  
  return true;
};
