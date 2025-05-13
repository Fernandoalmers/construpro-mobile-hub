
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService, Address } from '@/services/addressService';
import { toast } from '@/components/ui/use-toast';

export function useAddresses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const queryClient = useQueryClient();

  // Fetch addresses
  const { 
    data: addresses = [], 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.getAddresses(),
    // Using meta to handle onSuccess and onError in latest React Query version
    meta: {
      onSuccess: (data: Address[]) => {
        console.log("Addresses loaded successfully:", data);
      }
    },
    // Error handling moved to the onError option in the query options
    onError: (err: any) => {
      console.error("Error fetching addresses:", err);
      toast({
        variant: "destructive",
        title: "Erro ao carregar endereços",
        description: err.message || "Não foi possível carregar seus endereços."
      });
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressService.deleteAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Endereço removido",
        description: "Endereço removido com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover endereço",
        description: error.message || "Não foi possível remover o endereço."
      });
    }
  });

  // Set primary address mutation
  const setPrimaryAddressMutation = useMutation({
    mutationFn: (addressId: string) => addressService.setPrimaryAddress(addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Endereço principal atualizado",
        description: "Endereço principal atualizado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar endereço principal", 
        description: error.message || "Não foi possível atualizar o endereço principal."
      });
    }
  });

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: (data: { address: Address, isEdit: boolean }) => {
      if (data.isEdit && data.address.id) {
        return addressService.updateAddress(data.address.id, data.address);
      } else {
        return addressService.addAddress(data.address);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: variables.isEdit ? "Endereço atualizado" : "Endereço adicionado",
        description: variables.isEdit 
          ? "Endereço atualizado com sucesso." 
          : "Endereço adicionado com sucesso."
      });
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar endereço",
        description: error.message || "Não foi possível salvar o endereço."
      });
    }
  });

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
    saveAddressMutation.mutate({ 
      address, 
      isEdit: Boolean(editingAddress) 
    });
  };

  const getPrimaryAddress = () => {
    return addresses.find(address => address.principal);
  };

  return {
    addresses,
    isLoading,
    error,
    refetch,
    isAddModalOpen,
    setIsAddModalOpen,
    editingAddress,
    getPrimaryAddress,
    handleSetDefaultAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleAddAddress,
    handleSaveAddress
  };
}
