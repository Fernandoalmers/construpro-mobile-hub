
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

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

type DbStore = Database['public']['Tables']['stores']['Row'];

// Helper function to convert DB store to app Store type
const mapDbStoreToStore = (dbStore: DbStore): Store => {
  return {
    id: dbStore.id,
    nome: dbStore.nome,
    descricao: dbStore.descricao || undefined,
    logo_url: dbStore.logo_url || undefined,
    endereco: dbStore.endereco as unknown as StoreAddress,
    contato: dbStore.contato || undefined,
    owner_id: dbStore.owner_id || undefined,
    profile_id: dbStore.profile_id || undefined,
    operating_hours: dbStore.operating_hours as unknown as OperatingHours,
    created_at: dbStore.created_at,
    updated_at: dbStore.updated_at
  };
};

// Helper function to convert app Store type to DB store format
const mapStoreToDbStore = (store: Partial<Store>): Partial<DbStore> => {
  return {
    id: store.id,
    nome: store.nome,
    descricao: store.descricao,
    logo_url: store.logo_url,
    endereco: store.endereco as any,
    contato: store.contato,
    owner_id: store.owner_id,
    profile_id: store.profile_id,
    operating_hours: store.operating_hours as any,
    created_at: store.created_at,
    updated_at: store.updated_at
  };
};

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
  
  return data ? mapDbStoreToStore(data as DbStore) : null;
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
  
  return data ? data.map(item => mapDbStoreToStore(item as DbStore)) : [];
};

// Create or update store
export const saveStore = async (store: Partial<Store>): Promise<Store | null> => {
  // Ensure we have the required fields for new stores
  if (!store.id && !store.nome) {
    console.error('Store name is required for new stores');
    return null;
  }
  
  const dbStore = mapStoreToDbStore(store);
  
  if (store.id) {
    // Update existing store
    const { data, error } = await supabase
      .from('stores')
      .update(dbStore)
      .eq('id', store.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating store:', error);
      return null;
    }
    
    return data ? mapDbStoreToStore(data as DbStore) : null;
  } else {
    // Create new store
    const { data, error } = await supabase
      .from('stores')
      .insert({ 
        ...dbStore,
        nome: dbStore.nome || '' // Ensure nome is provided as it's required
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating store:', error);
      return null;
    }
    
    return data ? mapDbStoreToStore(data as DbStore) : null;
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
