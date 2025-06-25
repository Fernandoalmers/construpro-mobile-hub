
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

  // Enhanced CEP validation function
  const validateCEP = (cep: string): boolean => {
    // Remove non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');
    
    // Check if CEP has 8 digits
    if (cleanCep.length !== 8) {
      return false;
    }
    
    // Check if CEP is not all zeros or same digit
    if (cleanCep === '00000000' || /^(\d)\1{7}$/.test(cleanCep)) {
      return false;
    }
    
    return true;
  };

  // Enhanced address validation with better CEP handling
  const validateAddress = (address: Address): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!address.nome?.trim()) {
      errors.push('Nome é obrigatório');
    }
    
    if (!address.cep?.trim()) {
      errors.push('CEP é obrigatório');
    } else if (!validateCEP(address.cep)) {
      errors.push('CEP deve ter 8 dígitos e ser válido');
    }
    
    if (!address.logradouro?.trim()) {
      errors.push('Logradouro é obrigatório');
    }
    
    if (!address.numero?.trim()) {
      errors.push('Número é obrigatório');
    }
    
    if (!address.bairro?.trim()) {
      errors.push('Bairro é obrigatório');
    }
    
    if (!address.cidade?.trim()) {
      errors.push('Cidade é obrigatória');
    }
    
    if (!address.estado?.trim()) {
      errors.push('Estado é obrigatório');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Fetch addresses with enhanced error handling
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
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for validation errors
      if (failureCount < 3) {
        console.log(`Retrying address fetch, attempt ${failureCount + 1}`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

  // Enhanced set primary address mutation with detailed logging
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`[useAddresses] Setting address ${addressId} as primary`);
        
        // Add optimistic update to improve UX
        const currentAddresses = queryClient.getQueryData(['addresses']) as Address[] || [];
        console.log(`[useAddresses] Current addresses before update:`, currentAddresses.map(a => ({ id: a.id, nome: a.nome, principal: a.principal })));
        
        const result = await addressService.setPrimaryAddress(addressId);
        console.log(`[useAddresses] Primary address update result:`, result);
        
        return result;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("[useAddresses] Set primary address error:", errorMsg);
        throw err;
      }
    },
    onMutate: async (addressId: string) => {
      // Optimistic update
      console.log(`[useAddresses] Optimistically updating address ${addressId} as primary`);
      
      await queryClient.cancelQueries({ queryKey: ['addresses'] });
      const previousAddresses = queryClient.getQueryData(['addresses']) as Address[];
      
      if (previousAddresses) {
        const optimisticAddresses = previousAddresses.map(addr => ({
          ...addr,
          principal: addr.id === addressId
        }));
        
        queryClient.setQueryData(['addresses'], optimisticAddresses);
        console.log(`[useAddresses] Optimistic update applied`);
      }
      
      return { previousAddresses };
    },
    onSuccess: (result, addressId) => {
      console.log(`[useAddresses] Primary address set successfully:`, addressId);
      
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refreshProfile(); // Refresh user profile to update primary address
      
      toast({
        title: "Endereço principal atualizado",
        description: "Endereço definido como principal com sucesso."
      });
    },
    onError: (error: any, addressId, context) => {
      console.error(`[useAddresses] Failed to set primary address ${addressId}:`, error);
      
      // Rollback optimistic update
      if (context?.previousAddresses) {
        queryClient.setQueryData(['addresses'], context.previousAddresses);
        console.log(`[useAddresses] Rolled back optimistic update`);
      }
      
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "Erro ao definir endereço principal", 
        description: errorMsg
      });
    }
  });

  // Enhanced save address mutation with better validation and retry
  const saveAddressMutation = useMutation({
    mutationFn: async (data: { address: Address, isEdit: boolean }) => {
      try {
        console.log("Saving address:", data.isEdit ? "Edit" : "Add", data.address);
        console.log("Address ID for edit check:", data.address.id);
        
        // Validate address before saving
        const validation = validateAddress(data.address);
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        
        // Clean and format CEP
        const cleanedAddress = {
          ...data.address,
          cep: data.address.cep.replace(/\D/g, '')
        };
        
        if (data.isEdit && data.address.id) {
          console.log("Calling updateAddress with ID:", data.address.id);
          const result = await addressService.updateAddress(data.address.id, cleanedAddress);
          
          // Retry mechanism for failed updates
          if (!result) {
            console.log("Update failed, retrying...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await addressService.updateAddress(data.address.id, cleanedAddress);
          }
          
          return result;
        } else {
          console.log("Calling addAddress for new address");
          const result = await addressService.addAddress(cleanedAddress);
          
          // Retry mechanism for failed inserts
          if (!result) {
            console.log("Insert failed, retrying...");
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await addressService.addAddress(cleanedAddress);
          }
          
          return result;
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
      
      // Special handling for CEP-related errors
      if (errorMsg.includes('CEP') || errorMsg.includes('cep')) {
        toast({
          variant: "destructive",
          title: "Erro de CEP",
          description: "Verifique se o CEP está correto e tente novamente. CEPs de cidades menores podem demorar mais para validar."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao salvar endereço",
          description: errorMsg
        });
      }
    },
    retry: 2,
    retryDelay: 1000
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
    console.log(`[useAddresses] User requested to set address ${addressId} as primary`);
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

  // Add the addAddress function needed by useCheckout with enhanced validation
  const addAddress = async (formData: Partial<Address>): Promise<Address | null> => {
    try {
      // Create a complete Address object from partial data
      const fullAddress: Address = {
        id: '',
        nome: formData.nome || '',
        cep: formData.cep?.replace(/\D/g, '') || '',
        logradouro: formData.logradouro || '',
        numero: formData.numero || '',
        complemento: formData.complemento || '',
        bairro: formData.bairro || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        principal: formData.principal || false,
        ...formData // Override with any provided fields
      };

      // Validate before saving
      const validation = validateAddress(fullAddress);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      // Save the address with retry
      let result = await addressService.addAddress(fullAddress);
      
      // Retry if failed
      if (!result) {
        console.log("First attempt failed, retrying address creation...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        result = await addressService.addAddress(fullAddress);
      }
      
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
    addAddress, // Export the enhanced addAddress function
    validateAddress, // Export validation function for use in components
    isSettingPrimary: setPrimaryAddressMutation.isPending, // Add loading state for primary button
  };
}

