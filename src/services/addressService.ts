
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
    console.log('[addressService] 🏠 Definindo endereço principal:', { addressId, userId });
    
    try {
      // Get address data that will be set as primary
      const { data: addressData, error: fetchError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (fetchError) {
        console.error('[addressService] ❌ Erro ao buscar endereço:', fetchError);
        throw fetchError;
      }

      console.log('[addressService] 📋 Endereço encontrado:', {
        nome: addressData.nome,
        cep: addressData.cep,
        cidade: addressData.cidade
      });

      // Unset all other addresses as primary
      const { error: unsetError } = await supabase
        .from('user_addresses')
        .update({ 
          principal: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .neq('id', addressId);

      if (unsetError) {
        console.error('[addressService] ❌ Erro ao desmarcar outros endereços:', unsetError);
        throw unsetError;
      }

      console.log('[addressService] ✅ Outros endereços desmarcados como principal');

      // Set selected address as primary
      const { error: updateError } = await supabase
        .from('user_addresses')
        .update({ 
          principal: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', addressId);

      if (updateError) {
        console.error('[addressService] ❌ Erro ao marcar endereço como principal:', updateError);
        throw updateError;
      }

      console.log('[addressService] ✅ Endereço marcado como principal');

      // Update profile's endereco_principal
      const enderecoCompleto = {
        logradouro: addressData.logradouro,
        numero: addressData.numero,
        complemento: addressData.complemento || '',
        bairro: addressData.bairro,
        cidade: addressData.cidade,
        estado: addressData.estado,
        cep: addressData.cep
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          endereco_principal: enderecoCompleto,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) {
        console.error('[addressService] ❌ Erro ao atualizar perfil:', profileError);
        console.warn('[addressService] ⚠️ Continuando sem sincronização do perfil');
      } else {
        console.log('[addressService] ✅ Perfil atualizado com endereco_principal');
      }

      console.log('[addressService] 🎉 Endereço principal definido com sucesso');

    } catch (error) {
      console.error('[addressService] ❌ Erro geral ao definir endereço principal:', error);
      throw error;
    }
  },

  async addAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [addressService] 🏠 INICIANDO salvamento de endereço:`, {
      nome: address.nome,
      cep: address.cep,
      cidade: address.cidade,
      principal: address.principal,
      user_id: address.user_id
    });

    try {
      // Prepare address data with timestamps
      const addressData = {
        ...address,
        cep: address.cep.replace(/\D/g, ''), // Clean CEP
        created_at: timestamp,
        updated_at: timestamp
      };

      console.log(`[${timestamp}] [addressService] 📤 Dados preparados para inserção:`, addressData);

      // Direct insert to user_addresses table
      const { data, error } = await supabase
        .from('user_addresses')
        .insert(addressData)
        .select()
        .single();

      if (error) {
        console.error(`[${timestamp}] [addressService] ❌ ERRO na inserção direta:`, {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        console.error(`[${timestamp}] [addressService] ❌ ERRO: Nenhum dado retornado após inserção`);
        throw new Error('Nenhum endereço foi criado');
      }

      console.log(`[${timestamp}] [addressService] ✅ SUCESSO na inserção:`, {
        id: data.id,
        nome: data.nome,
        cep: data.cep,
        principal: data.principal
      });

      // If this is the primary address, ensure it's properly set
      if (address.principal) {
        console.log(`[${timestamp}] [addressService] 🔄 Definindo como endereço principal...`);
        await this.setPrimaryAddress(data.id, address.user_id);
      }

      console.log(`[${timestamp}] [addressService] 🎉 PROCESSO COMPLETO - endereço salvo:`, data.id);
      return data;

    } catch (error) {
      console.error(`[${timestamp}] [addressService] ❌ ERRO GERAL no salvamento:`, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        addressData: {
          nome: address.nome,
          cep: address.cep,
          user_id: address.user_id
        }
      });
      throw error;
    }
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
