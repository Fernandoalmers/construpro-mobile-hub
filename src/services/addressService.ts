
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
    console.log('[addressService] 🏠 Iniciando definição de endereço principal:', { addressId, userId });
    
    try {
      // PASSO 1: Buscar dados do endereço que será definido como principal
      const { data: addressData, error: fetchError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .single();

      if (fetchError) {
        console.error('[addressService] ❌ Erro ao buscar endereço:', fetchError);
        throw fetchError;
      }

      console.log('[addressService] 📋 Dados do endereço encontrado:', {
        nome: addressData.nome,
        cep: addressData.cep,
        cidade: addressData.cidade
      });

      // PASSO 2: Desmarcar todos os outros endereços como principal
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

      // PASSO 3: Marcar o endereço selecionado como principal
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

      console.log('[addressService] ✅ Endereço marcado como principal na tabela user_addresses');

      // PASSO 4: Atualizar o endereco_principal no perfil do usuário
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
        console.error('[addressService] ❌ Erro ao atualizar endereco_principal no perfil:', profileError);
        // Não vamos fazer throw aqui para não bloquear o fluxo
        console.warn('[addressService] ⚠️ Continuando sem sincronização do perfil');
      } else {
        console.log('[addressService] ✅ Perfil atualizado com endereco_principal:', {
          cep: enderecoCompleto.cep,
          cidade: enderecoCompleto.cidade
        });
      }

      // PASSO 5: Aguardar um momento para garantir que as mudanças foram persistidas
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[addressService] 🎉 Sincronização completa - endereço principal definido');

    } catch (error) {
      console.error('[addressService] ❌ Erro geral ao definir endereço principal:', error);
      throw error;
    }
  },

  async addAddress(address: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    console.log('[addressService] 🏠 Iniciando salvamento de endereço:', {
      nome: address.nome,
      cep: address.cep,
      cidade: address.cidade,
      principal: address.principal
    });

    try {
      // Usar a Edge Function para salvar o endereço
      const { data, error } = await supabase.functions.invoke('address-management', {
        body: {
          nome: address.nome,
          cep: address.cep,
          logradouro: address.logradouro,
          numero: address.numero,
          complemento: address.complemento || '',
          bairro: address.bairro,
          cidade: address.cidade,
          estado: address.estado,
          principal: address.principal
        }
      });

      if (error) {
        console.error('[addressService] ❌ Erro na Edge Function:', error);
        throw error;
      }

      if (!data.success) {
        console.error('[addressService] ❌ Edge Function retornou erro:', data.error);
        throw new Error(data.error);
      }

      console.log('[addressService] ✅ Endereço salvo com sucesso via Edge Function:', data.data.address.id);
      return data.data.address;

    } catch (error) {
      console.error('[addressService] ❌ Erro ao salvar endereço:', error);
      
      // Fallback: tentar salvar diretamente no banco se a Edge Function falhar
      console.log('[addressService] 🔄 Tentando fallback direto no banco...');
      
      try {
        const { data, error: directError } = await supabase
          .from('user_addresses')
          .insert({
            ...address,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (directError) {
          console.error('[addressService] ❌ Erro no fallback direto:', directError);
          throw directError;
        }

        // Se este é o endereço principal, executar sincronização
        if (address.principal) {
          await this.setPrimaryAddress(data.id, address.user_id);
        }

        console.log('[addressService] ✅ Endereço salvo via fallback direto:', data.id);
        return data;

      } catch (fallbackError) {
        console.error('[addressService] ❌ Fallback também falhou:', fallbackError);
        throw fallbackError;
      }
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
