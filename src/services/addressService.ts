
import { supabase } from "@/integrations/supabase/client";

export interface Address {
  id?: string;
  nome: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
  created_at?: string;
  updated_at?: string;
}

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    const { data, error } = await supabase.functions.invoke('address-management');
    
    if (error) {
      console.error('Error getting addresses:', error);
      throw error;
    }
    
    return data?.addresses || [];
  },
  
  async getAddress(addressId: string): Promise<Address> {
    const { data, error } = await supabase.functions.invoke('address-management', {
      body: { id: addressId }
    });
    
    if (error) {
      console.error('Error getting address:', error);
      throw error;
    }
    
    return data?.address;
  },
  
  async addAddress(addressData: Address): Promise<Address> {
    const { data, error } = await supabase.functions.invoke('address-management', {
      method: 'POST',
      body: addressData
    });
    
    if (error) {
      console.error('Error adding address:', error);
      throw error;
    }
    
    return data?.address;
  },
  
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    const { data, error } = await supabase.functions.invoke('address-management', {
      method: 'PUT',
      body: { id: addressId, ...addressData }
    });
    
    if (error) {
      console.error('Error updating address:', error);
      throw error;
    }
    
    return data?.address;
  },
  
  async deleteAddress(addressId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('address-management', {
      method: 'DELETE',
      body: { id: addressId }
    });
    
    if (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },
  
  async setPrimaryAddress(addressId: string): Promise<Address> {
    return this.updateAddress(addressId, { principal: true });
  }
}
