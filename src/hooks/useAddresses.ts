
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService, Address } from '@/services/addressService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

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
      // Refresh profile and invalidate queries
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      
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

  // Save address mutation
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
    onSuccess: (result, variables) => {
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      
      toast({
        title: variables.isEdit ? "✅ Endereço atualizado" : "✅ Endereço adicionado",
        description: variables.isEdit 
          ? "Endereço atualizado com sucesso." 
          : "Endereço adicionado com sucesso."
      });
      
      // Close modal and clear editing state
      setIsAddModalOpen(false);
      setEditingAddress(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar endereço",
        description: error.message || 'Erro desconhecido'
      });
    }
  });

  // Enhanced retry functionality
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

  const handleSaveAddress = (address: Address) => {
    const isEdit = Boolean(editingAddress);
    saveAddressMutation.mutate({ address, isEdit });
  };

  const getPrimaryAddress = () => {
    return addresses.find(address => address.principal);
  };

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
    handleSaveAddress,
    isSaving: saveAddressMutation.isPending,
    saveError: saveAddressMutation.error,
    isSettingPrimary: setPrimaryAddressMutation.isPending,
  };
}
