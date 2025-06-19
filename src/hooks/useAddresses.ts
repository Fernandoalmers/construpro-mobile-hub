
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService, Address } from '@/services/addressService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export function useAddresses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

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
    },
    // Added retry configuration
    retry: 2,
    retryDelay: 1000,
    // Added staleTime to reduce unnecessary refetches
    staleTime: 30000
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
      refreshProfile(); // Refresh user profile to update primary address
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
      refreshProfile(); // Refresh user profile to update primary address
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
        console.log("Address ID for edit check:", data.address.id);
        
        if (data.isEdit && data.address.id) {
          console.log("Calling updateAddress with ID:", data.address.id);
          return await addressService.updateAddress(data.address.id, data.address);
        } else {
          console.log("Calling addAddress for new address");
          return await addressService.addAddress(data.address);
        }
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("Save address error:", errorMsg);
        throw err;
      }
    },
    onSuccess: (result, variables) => {
      console.log("Address saved successfully:", result);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refreshProfile(); // Refresh user profile to update primary address
      setErrorDetails(null);
      toast({
        title: variables.isEdit ? "Endereço atualizado" : "Endereço adicionado",
        description: variables.isEdit 
          ? "Endereço atualizado com sucesso." 
          : "Endereço adicionado com sucesso."
      });
      setIsAddModalOpen(false);
      setEditingAddress(null); // Clear editing state
    },
    onError: (error: any) => {
      const errorMsg = formatErrorMessage(error);
      console.error("Save address mutation error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar endereço",
        description: errorMsg
      });
    }
  });

  // Add retry functionality
  const retryOperation = useCallback(async () => {
    toast({
      title: "Tentando novamente",
      description: "Tentando carregar seus endereços..."
    });
    await refetch();
  }, [refetch]);

  const handleSetDefaultAddress = (addressId: string) => {
    setPrimaryAddressMutation.mutate(addressId);
  };

  const handleEditAddress = (address: Address) => {
    console.log('[useAddresses] Setting address for editing:', address);
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Tem certeza que deseja remover este endereço?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleAddAddress = () => {
    console.log('[useAddresses] Opening modal for new address');
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAddress = (address: Address) => {
    console.log("handleSaveAddress called with:", address);
    console.log("editingAddress state:", editingAddress);
    
    const isEdit = Boolean(editingAddress);
    console.log("Is edit mode:", isEdit);
    
    saveAddressMutation.mutate({ 
      address, 
      isEdit 
    });
  };

  // Add the addAddress function needed by useCheckout
  const addAddress = async (formData: Partial<Address>): Promise<Address | null> => {
    try {
      // Create a complete Address object from partial data
      const fullAddress: Address = {
        id: '',
        nome: formData.nome || '',
        cep: formData.cep || '',
        logradouro: formData.logradouro || '',
        numero: formData.numero || '',
        complemento: formData.complemento || '',
        bairro: formData.bairro || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        principal: formData.principal || false,
        ...formData // Override with any provided fields
      };

      // Save the address
      const result = await addressService.addAddress(fullAddress);
      
      // Refresh the address list and user profile
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      await refreshProfile();
      
      return result;
    } catch (error) {
      console.error("Error adding address:", error);
      throw error;
    }
  };

  const getPrimaryAddress = () => {
    return addresses.find(address => address.principal);
  };

  return {
    addresses,
    isLoading,
    error,
    errorDetails,
    refetch: retryOperation, // Use our enhanced retry function
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
    addAddress, // Export the new addAddress function
  };
}
