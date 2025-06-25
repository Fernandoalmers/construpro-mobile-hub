
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

// Direct Supabase operations as fallback
const directSupabaseOperations = {
  async getAddresses(): Promise<Address[]> {
    console.log('[addressService] Using direct Supabase fallback for getAddresses');
    
    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[addressService] Direct Supabase error:', error);
      throw new Error(error.message);
    }

    return addresses || [];
  },

  async addAddress(addressData: Address): Promise<Address> {
    console.log('[addressService] Using direct Supabase fallback for addAddress');
    
    const session = await ensureAuthSession();
    
    // If setting as principal, first clear other principal addresses
    if (addressData.principal) {
      await supabase
        .from('user_addresses')
        .update({ principal: false })
        .eq('principal', true)
        .eq('user_id', session.user.id);
    }

    const { data: address, error } = await supabase
      .from('user_addresses')
      .insert({
        ...addressData,
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('[addressService] Direct Supabase error:', error);
      throw new Error(error.message);
    }

    return address;
  },

  async updateAddress(addressId: string, addressData: Partial<Address>): Promise<Address> {
    console.log('[addressService] Using direct Supabase fallback for updateAddress');
    
    const session = await ensureAuthSession();
    
    // If setting as principal, first clear other principal addresses
    if (addressData.principal) {
      await supabase
        .from('user_addresses')
        .update({ principal: false })
        .eq('principal', true)
        .eq('user_id', session.user.id)
        .neq('id', addressId);
    }

    const { data: address, error } = await supabase
      .from('user_addresses')
      .update(addressData)
      .eq('id', addressId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('[addressService] Direct Supabase error:', error);
      throw new Error(error.message);
    }

    return address;
  },

  async deleteAddress(addressId: string): Promise<void> {
    console.log('[addressService] Using direct Supabase fallback for deleteAddress');
    
    const session = await ensureAuthSession();
    
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[addressService] Direct Supabase error:', error);
      throw new Error(error.message);
    }
  }
};

// Enhanced function invocation with automatic fallback
async function invokeAddressFunctionWithFallback(options: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any,
  fallbackOperation?: () => Promise<any>
}) {
  const { method, body, fallbackOperation } = options;
  
  try {
    console.log(`[addressService] Attempting edge function call: ${method}`);
    
    const invokeOptions: any = {};
    if (body) {
      invokeOptions.body = body;
    }
    
    const { data, error } = await supabase.functions.invoke('address-management', invokeOptions);
    
    if (error) {
      console.warn(`[addressService] Edge function error, falling back to direct Supabase:`, error);
      if (fallbackOperation) {
        return await fallbackOperation();
      }
      throw error;
    }
    
    console.log(`[addressService] Edge function success`);
    return data;
  } catch (error) {
    console.warn(`[addressService] Edge function failed, using direct Supabase fallback:`, error);
    if (fallbackOperation) {
      return await fallbackOperation();
    }
    throw error;
  }
}

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    console.log('[addressService] Fetching all addresses');
    try {
      await ensureAuthSession();
      
      const data = await invokeAddressFunctionWithFallback({
        method: 'GET',
        fallbackOperation: directSupabaseOperations.getAddresses
      });
      
      console.log('[addressService] Addresses fetched successfully:', data?.addresses?.length || data?.length || 0);
      return data?.addresses || data || [];
    } catch (error) {
      console.error('[addressService] Error in getAddresses:', error);
      throw new Error(`Failed to fetch addresses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  async getAddress(addressId: string): Promise<Address> {
    console.log('[addressService] Fetching address by ID:', addressId);
    try {
      const session = await ensureAuthSession();
      
      // For get single address, use direct Supabase as it's more reliable
      const { data: address, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!address) {
        throw new Error('Address not found');
      }
      
      console.log('[addressService] Address fetched successfully:', address.id);
      return address;
    } catch (error) {
      console.error('[addressService] Error in getAddress:', error);
      throw new Error(`Failed to get address details: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      const result = await invokeAddressFunctionWithFallback({
        method: 'POST',
        body: addressData,
        fallbackOperation: () => directSupabaseOperations.addAddress(addressData)
      });
      
      const address = result?.address || result;
      if (!address) {
        throw new Error('Failed to add address: Invalid response');
      }
      
      console.log('[addressService] Address added successfully:', address.id);
      return address;
    } catch (error) {
      console.error('[addressService] Error in addAddress:', error);
      throw new Error(`Failed to add address: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      const result = await invokeAddressFunctionWithFallback({
        method: 'PUT',
        body: updatePayload,
        fallbackOperation: () => directSupabaseOperations.updateAddress(addressId, addressData)
      });
      
      const address = result?.address || result;
      if (!address) {
        throw new Error('Failed to update address: Invalid response');
      }
      
      console.log('[addressService] Address updated successfully');
      return address;
    } catch (error) {
      console.error('[addressService] Error in updateAddress:', error);
      throw new Error(`Failed to update address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  async deleteAddress(addressId: string): Promise<void> {
    console.log('[addressService] Deleting address:', addressId);
    try {
      await ensureAuthSession();
      
      if (!addressId) {
        throw new Error('Address ID is required');
      }
      
      await invokeAddressFunctionWithFallback({
        method: 'DELETE',
        body: { id: addressId },
        fallbackOperation: () => directSupabaseOperations.deleteAddress(addressId)
      });
      
      console.log('[addressService] Address deleted successfully');
    } catch (error) {
      console.error('[addressService] Error in deleteAddress:', error);
      throw new Error(`Failed to delete address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  async setPrimaryAddress(addressId: string): Promise<Address> {
    console.log('[addressService] Setting address as primary:', addressId);
    try {
      return this.updateAddress(addressId, { principal: true });
    } catch (error) {
      console.error('[addressService] Error in setPrimaryAddress:', error);
      throw new Error(`Failed to set primary address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
