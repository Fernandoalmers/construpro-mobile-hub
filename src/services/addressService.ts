
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

// Enhanced function invocation with better error handling
async function invokeAddressFunction(options: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any,
  retries?: number
}) {
  const { method, body, retries = 2 } = options;
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[addressService] Attempt ${attempt + 1} - Invoking address function:`, { method, hasBody: !!body });
      
      const invokeOptions: any = {};
      
      if (body) {
        invokeOptions.body = body;
      }
      
      const { data, error } = await supabase.functions.invoke('address-management', invokeOptions);
      
      if (error) {
        throw error;
      }
      
      console.log(`[addressService] Success on attempt ${attempt + 1}`);
      return data;
    } catch (error) {
      lastError = error;
      console.error(`[addressService] Attempt ${attempt + 1} failed:`, error);
      
      // Don't retry on authentication errors
      if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`[addressService] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    console.log('[addressService] Fetching all addresses');
    try {
      await ensureAuthSession();
      
      const data = await invokeAddressFunction({ method: 'GET' });
      
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
      
      const data = await invokeAddressFunction({ 
        method: 'GET', 
        body: { id: addressId } 
      });
      
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
      
      const data = await invokeAddressFunction({
        method: 'POST',
        body: addressData
      });
      
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
      
      const data = await invokeAddressFunction({
        method: 'PUT',
        body: updatePayload,
        retries: 3 // More retries for principal updates
      });
      
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
      
      const data = await invokeAddressFunction({
        method: 'DELETE',
        body: { id: addressId }
      });
      
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
