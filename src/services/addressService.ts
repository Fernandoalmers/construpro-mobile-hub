
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
    console.log('Fetching all addresses');
    const { data, error } = await supabase.functions.invoke('address-management');
    
    if (error) {
      console.error('Error getting addresses:', error);
      throw error;
    }
    
    console.log('Addresses fetched successfully:', data?.addresses?.length || 0);
    return data?.addresses || [];
  },
  
  async getAddress(addressId: string): Promise<Address> {
    console.log('Fetching address by ID:', addressId);
    const { data, error } = await supabase.functions.invoke('address-management', {
      body: { id: addressId }
    });
    
    if (error) {
      console.error('Error getting address:', error);
      throw error;
    }
    
    if (!data?.address) {
      console.error('Address not found');
      throw new Error('Address not found');
    }
    
    console.log('Address fetched successfully:', data.address.id);
    return data.address;
  },
  
  async addAddress(addressData: Address): Promise<Address> {
    console.log('Adding new address:', addressData);
    
    try {
      // Ensure session is valid
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.error('No active session found');
        throw new Error('Authentication required');
      }
      
      console.log('Active session found, user:', sessionData.session.user.id);
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'POST',
        body: addressData
      });
      
      if (error) {
        console.error('Error adding address:', error);
        throw error;
      }
      
      if (!data?.address) {
        console.error('Response missing address data:', data);
        throw new Error('Failed to add address: Invalid response');
      }
      
      console.log('Address added successfully:', data.address.id);
      return data.address;
    } catch (error) {
      console.error('Fatal error adding address:', error);
      throw error;
    }
  },
  
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    console.log('Updating address:', addressId, addressData);
    const { data, error } = await supabase.functions.invoke('address-management', {
      method: 'PUT',
      body: { id: addressId, ...addressData }
    });
    
    if (error) {
      console.error('Error updating address:', error);
      throw error;
    }
    
    if (!data?.address) {
      console.error('Response missing address data:', data);
      throw new Error('Failed to update address: Invalid response');
    }
    
    console.log('Address updated successfully');
    return data.address;
  },
  
  async deleteAddress(addressId: string): Promise<void> {
    console.log('Deleting address:', addressId);
    const { error, data } = await supabase.functions.invoke('address-management', {
      method: 'DELETE',
      body: { id: addressId }
    });
    
    if (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
    
    console.log('Address deleted successfully');
  },
  
  async setPrimaryAddress(addressId: string): Promise<Address> {
    console.log('Setting address as primary:', addressId);
    return this.updateAddress(addressId, { principal: true });
  }
}
