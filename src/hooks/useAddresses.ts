
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService, Address } from '@/services/addressService';
import { toast } from '@/components/ui/use-toast';

export function useAddresses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Function to format error messages for better display
  const formatErrorMessage = (error: any): string => {
    console.error("Error in addresses:", error);
    let errorMessage = 'Um erro inesperado ocorreu.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = error.message || JSON.stringify(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Save detailed error for debugging
    setErrorDetails(typeof error === 'object' ? JSON.stringify(error) : String(error));
    
    return errorMessage;
  };

  // Fetch addresses
  const { 
    data: addresses = [], 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      try {
        console.log("Fetching addresses...");
        const data = await addressService.getAddresses();
        console.log("Addresses loaded successfully:", data);
        setErrorDetails(null); // Clear any previous errors
        return data;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("Error fetching addresses:", errorMsg);
        throw err; // Rethrow to let React Query handle it
      }
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`Deleting address with ID: ${addressId}`);
        return await addressService.deleteAddress(addressId);
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("Delete address error:", errorMsg);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Endereço removido",
        description: "Endereço removido com sucesso."
      });
    },
    onError: (error: any) => {
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "Erro ao remover endereço",
        description: errorMsg
      });
    }
  });

  // Set primary address mutation
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`Setting address ${addressId} as primary`);
        return await addressService.setPrimaryAddress(addressId);
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("Set primary address error:", errorMsg);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Endereço principal atualizado",
        description: "Endereço principal atualizado com sucesso."
      });
    },
    onError: (error: any) => {
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar endereço principal", 
        description: errorMsg
      });
    }
  });

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: { address: Address, isEdit: boolean }) => {
      try {
        console.log("Saving address:", data.isEdit ? "Edit" : "Add", data.address);
        if (data.isEdit && data.address.id) {
          return await addressService.updateAddress(data.address.id, data.address);
        } else {
          return await addressService.addAddress(data.address);
        }
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("Save address error:", errorMsg);
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      console.log("Address saved successfully");
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setErrorDetails(null);
      toast({
        title: variables.isEdit ? "Endereço atualizado" : "Endereço adicionado",
        description: variables.isEdit 
          ? "Endereço atualizado com sucesso." 
          : "Endereço adicionado com sucesso."
      });
      setIsAddModalOpen(false);
    },
    onError: (error: any) => {
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar endereço",
        description: errorMsg
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
    console.log("handleSaveAddress called with:", address);
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
    errorDetails,
    refetch,
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
    saveError: saveAddressMutation.error
  };
}
