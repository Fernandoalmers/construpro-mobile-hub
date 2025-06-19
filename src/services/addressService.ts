
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
    console.log('[addressService] Fetching all addresses');
    try {
      await ensureAuthSession();
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'GET'
      });
      
      console.log('[addressService] Edge function response:', { data, error });
      
      if (error) {
        console.error('[addressService] Edge function error:', error);
        throw error;
      }
      
      console.log('[addressService] Addresses fetched successfully:', data?.addresses?.length || 0);
      return data?.addresses || [];
    } catch (error) {
      console.error('[addressService] Error in getAddresses:', error);
      return handleApiError(error, "fetch addresses");
    }
  },
  
  async getAddress(addressId: string): Promise<Address> {
    console.log('[addressService] Fetching address by ID:', addressId);
    try {
      await ensureAuthSession();
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'GET',
        body: { id: addressId }
      });
      
      console.log('[addressService] Edge function response for single address:', { data, error });
      
      if (error) {
        console.error('[addressService] Edge function error:', error);
        throw error;
      }
      
      if (!data?.address) {
        throw new Error('Address not found');
      }
      
      console.log('[addressService] Address fetched successfully:', data.address.id);
      return data.address;
    } catch (error) {
      console.error('[addressService] Error in getAddress:', error);
      return handleApiError(error, "get address details");
    }
  },
  
  async addAddress(addressData: Address): Promise<Address> {
    console.log('[addressService] Adding new address:', addressData);
    
    try {
      const session = await ensureAuthSession();
      console.log('[addressService] Active session found, user:', session.user.id);
      
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
      
      console.log('[addressService] Edge function response for add:', { data, error });
      
      if (error) {
        console.error('[addressService] Edge function error:', error);
        throw error;
      }
      
      if (!data?.address) {
        throw new Error('Failed to add address: Invalid response');
      }
      
      console.log('[addressService] Address added successfully:', data.address.id);
      return data.address;
    } catch (error) {
      console.error('[addressService] Error in addAddress:', error);
      return handleApiError(error, "add address");
    }
  },
  
  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    console.log('[addressService] Updating address:', addressId, addressData);
    try {
      await ensureAuthSession();
      
      if (!addressId) {
        throw new Error('Address ID is required');
      }
      
      const updatePayload = { id: addressId, ...addressData };
      console.log('[addressService] Update payload:', updatePayload);
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'PUT',
        body: updatePayload
      });
      
      console.log('[addressService] Edge function response for update:', { data, error });
      
      if (error) {
        console.error('[addressService] Edge function error:', error);
        throw error;
      }
      
      if (!data?.address) {
        throw new Error('Failed to update address: Invalid response');
      }
      
      console.log('[addressService] Address updated successfully');
      return data.address;
    } catch (error) {
      console.error('[addressService] Error in updateAddress:', error);
      return handleApiError(error, "update address");
    }
  },
  
  async deleteAddress(addressId: string): Promise<void> {
    console.log('[addressService] Deleting address:', addressId);
    try {
      await ensureAuthSession();
      
      if (!addressId) {
        throw new Error('Address ID is required');
      }
      
      const { data, error } = await supabase.functions.invoke('address-management', {
        method: 'DELETE',
        body: { id: addressId }
      });
      
      console.log('[addressService] Edge function response for delete:', { data, error });
      
      if (error) {
        console.error('[addressService] Edge function error:', error);
        throw error;
      }
      
      console.log('[addressService] Address deleted successfully');
    } catch (error) {
      console.error('[addressService] Error in deleteAddress:', error);
      handleApiError(error, "delete address");
    }
  },
  
  async setPrimaryAddress(addressId: string): Promise<Address> {
    console.log('[addressService] Setting address as primary:', addressId);
    try {
      return this.updateAddress(addressId, { principal: true });
    } catch (error) {
      console.error('[addressService] Error in setPrimaryAddress:', error);
      return handleApiError(error, "set primary address");
    }
  }
};
