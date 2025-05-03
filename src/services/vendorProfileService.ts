import { supabase } from '@/integrations/supabase/client';

export interface VendorProfile {
  id: string;
  usuario_id: string;
  nome_loja: string;
  descricao?: string;
  logo?: string;
  banner?: string;
  segmento?: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  formas_entrega?: any[];
  created_at?: string;
  updated_at?: string;
}

export const getVendorProfile = async (): Promise<VendorProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return null;
    }
    
    const { data: vendorData, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('usuario_id', userData.user.id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      console.error('Error fetching vendor profile:', error);
      return null;
    }
    
    return vendorData as VendorProfile;
  } catch (error) {
    console.error('Error in getVendorProfile:', error);
    return null;
  }
};

export const createVendorProfile = async (profile: Partial<VendorProfile>): Promise<VendorProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return null;
    }
    
    // Set user_id
    const vendorProfile = {
      ...profile,
      usuario_id: userData.user.id,
      nome_loja: profile.nome_loja || 'Minha Loja' // Ensure nome_loja has a default value
    };
    
    // Insert a single object, not an array
    const { data, error } = await supabase
      .from('vendedores')
      .insert(vendorProfile)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating vendor profile:', error);
      return null;
    }
    
    // Update user role
    await supabase.auth.updateUser({
      data: {
        papel: 'lojista',
        tipo_perfil: 'lojista'
      }
    });
    
    return data as VendorProfile;
  } catch (error) {
    console.error('Error in createVendorProfile:', error);
    return null;
  }
};

export const updateVendorProfile = async (profile: Partial<VendorProfile>): Promise<VendorProfile | null> => {
  try {
    const currentProfile = await getVendorProfile();
    if (!currentProfile) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('vendedores')
      .update(profile)
      .eq('id', currentProfile.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating vendor profile:', error);
      return null;
    }
    
    return data as VendorProfile;
  } catch (error) {
    console.error('Error in updateVendorProfile:', error);
    return null;
  }
};

// Add these functions that are referenced in vendorService.ts
export const saveVendorProfile = async (profile: Partial<VendorProfile>): Promise<VendorProfile | null> => {
  const existingProfile = await getVendorProfile();
  if (existingProfile) {
    return updateVendorProfile(profile);
  } else {
    return createVendorProfile(profile);
  }
};

export const uploadVendorImage = async (file: File, type: 'logo' | 'banner'): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      return null;
    }
    
    const fileName = `${type}-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `vendors/${vendorProfile.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('vendor-assets')
      .upload(filePath, file, { upsert: true });
      
    if (error) {
      console.error(`Error uploading vendor ${type}:`, error);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-assets')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error(`Error in uploadVendorImage:`, error);
    return null;
  }
};

export const getVendorCustomers = async (): Promise<any[]> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('clientes_vendedor')
      .select('*')
      .eq('vendedor_id', vendorProfile.id)
      .order('ultimo_pedido', { ascending: false });
      
    if (error) {
      console.error('Error fetching vendor customers:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getVendorCustomers:', error);
    return [];
  }
};

export const getVendorOrders = async (): Promise<any[]> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        itens_pedido(*),
        profiles:usuario_id (nome, email, telefone)
      `)
      .eq('vendedor_id', vendorProfile.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching vendor orders:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getVendorOrders:', error);
    return [];
  }
};

// Upload vendor logo
export const uploadVendorLogo = async (file: File): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      return null;
    }
    
    const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `vendors/${vendorProfile.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('vendor-assets')
      .upload(filePath, file, { upsert: true });
      
    if (error) {
      console.error('Error uploading vendor logo:', error);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-assets')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadVendorLogo:', error);
    return null;
  }
};

// Upload vendor banner
export const uploadVendorBanner = async (file: File): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      return null;
    }
    
    const fileName = `banner-${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `vendors/${vendorProfile.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('vendor-assets')
      .upload(filePath, file, { upsert: true });
      
    if (error) {
      console.error('Error uploading vendor banner:', error);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-assets')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadVendorBanner:', error);
    return null;
  }
};
