
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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

// Helper function to check if we have an active session
async function ensureAuthSession() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("Session error:", sessionError);
    throw new Error(`Authentication error: ${sessionError.message}`);
  }
  
  if (!sessionData?.session) {
    console.error("No active session found");
    throw new Error("Authentication required. Please log in again.");
  }
  
  return sessionData.session;
}

// Helper to handle API errors consistently
function handleApiError(error: any, operation: string): never {
  console.error(`Error in ${operation}:`, error);
  
  // Try to extract more specific error message if available
  let errorMessage = `Failed to ${operation}`;
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = error.message || JSON.stringify(error);
  }
  
  throw new Error(errorMessage);
}

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    console.log('Fetching all addresses');
    try {
      await ensureAuthSession();
      
      // FIX: Don't send a body with GET request
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'GET'
        // Remove the body parameter for GET requests
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Addresses fetched successfully:', data?.addresses?.length || 0);
      return data?.addresses || [];
    } catch (error) {
      return handleApiError(error, "fetch addresses");
    }
  },
  
  async getAddress(addressId: string): Promise<Address> {
    console.log('Fetching address by ID:', addressId);
    try {
      await ensureAuthSession();
      
      // Use path parameters instead of body for GET requests
      const { data, error } = await supabase.functions.invoke(`address-management?id=${addressId}`, {
        method: 'GET'
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.address) {
        throw new Error('Address not found');
      }
      
      console.log('Address fetched successfully:', data.address.id);
      return data.address;
    } catch (error) {
      return handleApiError(error, "get address details");
    }
  },
  
  async addAddress(addressData: Address): Promise<Address> {
    console.log('Adding new address:', addressData);
    
    try {
      const session = await ensureAuthSession();
      console.log('Active session found, user:', session.user.id);
      
      // Validate required fields
      const requiredFields = ['nome', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
      const missingFields = requiredFields.filter(field => !addressData[field as keyof Address]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'POST',
        body: addressData
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.address) {
        throw new Error('Failed to add address: Invalid response');
      }
      
      console.log('Address added successfully:', data.address.id);
      return data.address;
    } catch (error) {
      return handleApiError(error, "add address");
    }
  },
  
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    console.log('Updating address:', addressId, addressData);
    try {
      await ensureAuthSession();
      
      if (!addressId) {
        throw new Error('Address ID is required');
      }
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'PUT',
        body: { id: addressId, ...addressData }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data?.address) {
        throw new Error('Failed to update address: Invalid response');
      }
      
      console.log('Address updated successfully');
      return data.address;
    } catch (error) {
      return handleApiError(error, "update address");
    }
  },
  
  async deleteAddress(addressId: string): Promise<void> {
    console.log('Deleting address:', addressId);
    try {
      await ensureAuthSession();
      
      if (!addressId) {
        throw new Error('Address ID is required');
      }
      
      const { error } = await supabase.functions.invoke('address-management', {
        method: 'DELETE',
        body: { id: addressId }
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Address deleted successfully');
    } catch (error) {
      handleApiError(error, "delete address");
    }
  },
  
  async setPrimaryAddress(addressId: string): Promise<Address> {
    console.log('Setting address as primary:', addressId);
    try {
      return this.updateAddress(addressId, { principal: true });
    } catch (error) {
      return handleApiError(error, "set primary address");
    }
  }
};
