
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService, Address } from '@/services/addressService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

// NOVO: Função para disparar evento global de endereço adicionado
const dispatchAddressAddedEvent = (address: Address) => {
  console.log('[useAddresses] 🚀 Disparando evento address-added:', address);
  
  const event = new CustomEvent('address-added', {
    detail: { address }
  });
  
  window.dispatchEvent(event);
};

export function useAddresses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const queryClient = useQueryClient();
  const { refreshProfile, user } = useAuth();

  // Fetch addresses
  const { 
    data: addresses = [], 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      return await addressService.getUserAddresses(user.id);
    },
    enabled: !!user?.id
  });

  // Set primary address mutation
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const addressToSet = addresses.find(addr => addr.id === addressId);
      if (!addressToSet) {
        throw new Error('Endereço não encontrado. Atualize a página e tente novamente.');
      }
      
      await addressService.setPrimaryAddress(addressId, user.id);
      return { addressId, newCep: addressToSet.cep };
    },
    onSuccess: async () => {
      await refreshProfile();
      // MELHORADO: Invalidação global mais robusta
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      
      toast({
        title: "✅ Endereço principal atualizado",
        description: "Endereço definido como principal com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao definir endereço principal", 
        description: error.message || 'Erro desconhecido'
      });
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      return await addressService.deleteAddress(addressId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "✅ Endereço removido",
        description: "Endereço removido com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover endereço",
        description: error.message || 'Erro desconhecido'
      });
    }
  });

  // Save address mutation - MELHORADO
  const saveAddressMutation = useMutation({
    mutationFn: async (data: { address: Address, isEdit: boolean }) => {
      const cleanedAddress = {
        ...data.address,
        cep: data.address.cep.replace(/\D/g, ''),
        user_id: user?.id || data.address.user_id
      };
      
      if (data.isEdit && data.address.id) {
        return await addressService.updateAddress(data.address.id, cleanedAddress);
      } else {
        return await addressService.addAddress(cleanedAddress);
      }
    },
    onSuccess: async (result, variables) => {
      console.log('[useAddresses] ✅ Endereço salvo com sucesso:', result);
      
      // MELHORADO: Invalidação global mais robusta
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      
      // NOVO: Disparar evento global para outros componentes
      if (result) {
        dispatchAddressAddedEvent(result);
      }
      
      // MELHORADO: Refresh do perfil para sincronizar endereco_principal
      if (!variables.isEdit || result?.principal) {
        await refreshProfile();
      }
      
      toast({
        title: variables.isEdit ? "✅ Endereço atualizado" : "✅ Endereço adicionado",
        description: variables.isEdit 
          ? "Endereço atualizado com sucesso." 
          : "Endereço adicionado com sucesso."
      });
      
      setIsAddModalOpen(false);
      setEditingAddress(null);
    },
    onError: (error: any) => {
      console.error('[useAddresses] ❌ Erro ao salvar endereço:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar endereço",
        description: error.message || 'Erro desconhecido'
      });
    }
  });

  // Add address function (for compatibility)
  const addAddress = useCallback(async (addressData: Partial<Address>) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const addressToAdd = {
      ...addressData,
      user_id: user.id,
      principal: addressData.principal ?? false
    } as Omit<Address, 'id' | 'created_at' | 'updated_at'>;

    const result = await addressService.addAddress(addressToAdd);
    
    // NOVO: Invalidação manual após addAddress
    await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    
    // NOVO: Disparar evento global
    if (result) {
      dispatchAddressAddedEvent(result);
    }
    
    // NOVO: Refresh do perfil se for endereço principal
    if (result?.principal) {
      await refreshProfile();
    }
    
    return result;
  }, [user?.id, queryClient, refreshProfile]);

  const retryOperation = useCallback(async () => {
    toast({
      title: "🔄 Atualizando",
      description: "Carregando seus endereços..."
    });
    await refetch();
  }, [refetch]);

  const handleSetDefaultAddress = (addressId: string) => {
    setPrimaryAddressMutation.mutate(addressId);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Tem certeza que deseja remover este endereço?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  // CORRIGIDO: Função para salvar endereços - removendo ID inválido
  const handleSaveAddress = async (address: Address) => {
    console.log('[useAddresses] 💾 Salvando endereço:', address);
    
    // Determinar se é edição ou novo endereço baseado em ID válido
    const hasValidId = address.id && address.id !== '' && Boolean(editingAddress?.id);
    const isEdit = hasValidId;
    
    // Garantir que tem user_id
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }
    
    // Preparar dados para salvar
    const addressToSave = {
      ...address,
      user_id: user.id,
      cep: address.cep.replace(/\D/g, '') // Limpar CEP
    };
    
    // CORREÇÃO: Remover campos problemáticos para novos endereços
    if (!isEdit) {
      // Para novos endereços, remover id, created_at, updated_at
      delete addressToSave.id;
      delete addressToSave.created_at;
      delete addressToSave.updated_at;
    }
    
    console.log('[useAddresses] 📋 Dados para salvar:', { addressToSave, isEdit });
    
    // Usar mutateAsync para aguardar corretamente a Promise
    return await saveAddressMutation.mutateAsync({ address: addressToSave, isEdit });
  };

  // Função original mantida para compatibilidade
  const handleSaveAddressOriginal = (address: Address) => {
    const isEdit = Boolean(editingAddress);
    saveAddressMutation.mutate({ address, isEdit });
  };

  const getPrimaryAddress = () => {
    return addresses.find(address => address.principal);
  };

  // NOVO: Função para invalidar cache globalmente
  const invalidateAddressesCache = useCallback(async () => {
    console.log('[useAddresses] 🗂️ Invalidando cache de endereços globalmente');
    await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    await refetch();
  }, [queryClient, refetch]);

  return {
    addresses,
    isLoading,
    error,
    errorDetails: null,
    refetch: retryOperation,
    isAddModalOpen,
    setIsAddModalOpen,
    editingAddress,
    getPrimaryAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleAddAddress,
    handleSaveAddress, // CORRIGIDA: Agora remove ID inválido
    handleSaveAddressOriginal, // Original para uso interno
    addAddress, // Restored for compatibility
    isSaving: saveAddressMutation.isPending,
    saveError: saveAddressMutation.error,
    isSettingPrimary: setPrimaryAddressMutation.isPending,
    
    // NOVO: Função para invalidação manual
    invalidateAddressesCache,
  };
}
