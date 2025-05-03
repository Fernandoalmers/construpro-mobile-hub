
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Types
export interface Vendor {
  id: string;
  usuario_id: string;
  nome_loja: string;
  logo?: string;
  banner?: string;
  segmento?: string;
  descricao?: string;
  formas_entrega?: string[];
  telefone?: string;
  whatsapp?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// Vendor Profile Management
export const getVendorProfile = async (): Promise<Vendor | null> => {
  try {
    // Get auth user id
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('usuario_id', user.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching vendor:', error);
      return null;
    }
    
    return data as Vendor;
  } catch (error) {
    console.error('Error in getVendorProfile:', error);
    return null;
  }
};

export const saveVendorProfile = async (vendorData: Partial<Vendor>): Promise<Vendor | null> => {
  try {
    // Get auth user id
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      return null;
    }
    
    // Check if vendor profile exists
    const { data: existingVendor } = await supabase
      .from('vendedores')
      .select('id')
      .eq('usuario_id', user.user.id)
      .single();
    
    let result;
    
    if (existingVendor) {
      // Update existing vendor
      const { data, error } = await supabase
        .from('vendedores')
        .update(vendorData)
        .eq('id', existingVendor.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new vendor - ensure nome_loja is provided
      if (!vendorData.nome_loja) {
        throw new Error('Nome da loja é obrigatório');
      }
      
      // Make sure we're providing a nome_loja value when creating a new vendor
      const newVendor = {
        ...vendorData,
        nome_loja: vendorData.nome_loja,
        usuario_id: user.user.id
      };
      
      const { data, error } = await supabase
        .from('vendedores')
        .insert(newVendor)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return result as Vendor;
  } catch (error) {
    console.error('Error saving vendor profile:', error);
    toast.error('Erro ao salvar dados da loja');
    return null;
  }
};

// File Upload Helpers for Profile
export const uploadVendorImage = async (
  file: File,
  folder: string,
  fileName: string
): Promise<string | null> => {
  try {
    const vendorProfile = await getVendorProfile();
    if (!vendorProfile) {
      toast.error('Perfil de vendedor não encontrado');
      return null;
    }
    
    const filePath = `${folder}/${vendorProfile.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('vendor-images')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadVendorImage:', error);
    return null;
  }
};
