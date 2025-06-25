
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
    console.log('[addressService] 🏠 Definindo endereço principal:', addressId);
    
    // Get the address data first
    const { data: addressData, error: fetchError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (fetchError) throw fetchError;

    // Set as primary (this will trigger the database function to unset others)
    const { error: updateError } = await supabase
      .from('user_addresses')
      .update({ 
        principal: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId);

    if (updateError) throw updateError;

    // CORRIGIDO: Atualizar também o endereco_principal no perfil para sincronização imediata
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        endereco_principal: {
          logradouro: addressData.logradouro,
          numero: addressData.numero,
          complemento: addressData.complemento,
          bairro: addressData.bairro,
          cidade: addressData.cidade,
          estado: addressData.estado,
          cep: addressData.cep
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.warn('[addressService] ⚠️ Aviso ao atualizar endereco_principal:', profileError);
    }

    console.log('[addressService] ✅ Endereço principal definido e perfil sincronizado');
  },

  async addAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        ...address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // If this is the primary address, sync with profile
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
