
import { supabase } from '@/integrations/supabase/client';

export interface Address {
  id: string;
  user_id: string;
  nome: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal: boolean;
  created_at: string;
  updated_at: string;
}

export const addressService = {
  async getUserAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async setPrimaryAddress(addressId: string, userId: string): Promise<void> {
    // Unset all other addresses as primary
    const { error: unsetError } = await supabase
      .from('user_addresses')
      .update({ 
        principal: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .neq('id', addressId);

    if (unsetError) throw unsetError;

    // Set selected address as primary
    const { error: updateError } = await supabase
      .from('user_addresses')
      .update({ 
        principal: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId);

    if (updateError) throw updateError;

    // Update profile's endereco_principal
    const { data: addressData } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (addressData) {
      const enderecoCompleto = {
        logradouro: addressData.logradouro,
        numero: addressData.numero,
        complemento: addressData.complemento || '',
        bairro: addressData.bairro,
        cidade: addressData.cidade,
        estado: addressData.estado,
        cep: addressData.cep
      };

      await supabase
        .from('profiles')
        .update({
          endereco_principal: enderecoCompleto,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }
  },

  async addAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    const timestamp = new Date().toISOString();
    
    const addressData = {
      ...address,
      cep: address.cep.replace(/\D/g, ''), // Clean CEP
      created_at: timestamp,
      updated_at: timestamp
    };

    const { data, error } = await supabase
      .from('user_addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Nenhum endereço foi criado');

    // If this is the primary address, ensure it's properly set
    if (address.principal) {
      await this.setPrimaryAddress(data.id, address.user_id);
    }

    return data;
  },

  async updateAddress(addressId: string, updates: Partial<Address>): Promise<Address> {
    const { data, error } = await supabase
      .from('user_addresses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .select()
      .single();

    if (error) throw error;

    // If setting as primary, sync with profile
    if (updates.principal) {
      await this.setPrimaryAddress(addressId, data.user_id);
    }

    return data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId);

    if (error) throw error;
  }
};
