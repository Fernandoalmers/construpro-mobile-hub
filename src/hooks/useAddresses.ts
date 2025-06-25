
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

  // Enhanced error formatting
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
    
    setErrorDetails(typeof error === 'object' ? JSON.stringify(error) : String(error));
    return errorMessage;
  };

  // Enhanced CEP validation
  const validateCEP = (cep: string): boolean => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return false;
    if (cleanCep === '00000000' || /^(\d)\1{7}$/.test(cleanCep)) return false;
    return true;
  };

  // Enhanced address validation
  const validateAddress = (address: Address): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!address.nome?.trim()) errors.push('Nome é obrigatório');
    if (!address.cep?.trim()) {
      errors.push('CEP é obrigatório');
    } else if (!validateCEP(address.cep)) {
      errors.push('CEP deve ter 8 dígitos e ser válido');
    }
    if (!address.logradouro?.trim()) errors.push('Logradouro é obrigatório');
    if (!address.numero?.trim()) errors.push('Número é obrigatório');
    if (!address.bairro?.trim()) errors.push('Bairro é obrigatório');
    if (!address.cidade?.trim()) errors.push('Cidade é obrigatória');
    if (!address.estado?.trim()) errors.push('Estado é obrigatório');
    
    return { isValid: errors.length === 0, errors };
  };

  // Fetch addresses with enhanced error handling and retry
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
        setErrorDetails(null);
        return data;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("Error fetching addresses:", errorMsg);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2) {
        console.log(`Retrying address fetch, attempt ${failureCount + 1}`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 10000 // Cache for 10 seconds
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
      refreshProfile();
      toast({
        title: "✅ Endereço removido",
        description: "Endereço removido com sucesso."
      });
    },
    onError: (error: any) => {
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao remover endereço",
        description: errorMsg
      });
    }
  });

  // Set primary address mutation with optimistic updates
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`[useAddresses] Setting address ${addressId} as primary`);
        
        const currentAddresses = queryClient.getQueryData(['addresses']) as Address[] || [];
        const addressExists = currentAddresses.find(addr => addr.id === addressId);
        
        if (!addressExists) {
          throw new Error('Endereço não encontrado. Atualize a página e tente novamente.');
        }
        
        console.log(`[useAddresses] Address exists, proceeding with principal update`);
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
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refreshProfile();
      
      toast({
        title: "✅ Endereço principal atualizado",
        description: "Endereço definido como principal com sucesso.",
        duration: 3000
      });
    },
    onError: (error: any, addressId, context) => {
      console.error(`[useAddresses] Failed to set primary address ${addressId}:`, error);
      
      if (context?.previousAddresses) {
        queryClient.setQueryData(['addresses'], context.previousAddresses);
        console.log(`[useAddresses] Rolled back optimistic update`);
      }
      
      const errorMsg = formatErrorMessage(error);
      
      if (errorMsg.includes('network') || errorMsg.includes('conexão') || errorMsg.includes('timeout')) {
        toast({
          variant: "destructive",
          title: "❌ Erro de conexão",
          description: "Verifique sua internet e tente novamente."
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Erro ao definir endereço principal", 
          description: errorMsg
        });
      }
    }
  });

  // Save address mutation with enhanced validation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: { address: Address, isEdit: boolean }) => {
      try {
        console.log("Saving address:", data.isEdit ? "Edit" : "Add", data.address);
        
        const validation = validateAddress(data.address);
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        
        const cleanedAddress = {
          ...data.address,
          cep: data.address.cep.replace(/\D/g, '')
        };
        
        if (data.isEdit && data.address.id) {
          console.log("Calling updateAddress with ID:", data.address.id);
          return await addressService.updateAddress(data.address.id, cleanedAddress);
        } else {
          console.log("Calling addAddress for new address");
          return await addressService.addAddress(cleanedAddress);
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
      refreshProfile();
      setErrorDetails(null);
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
      const errorMsg = formatErrorMessage(error);
      console.error("Save address mutation error:", error);
      
      if (errorMsg.includes('CEP') || errorMsg.includes('cep')) {
        toast({
          variant: "destructive",
          title: "❌ Erro de CEP",
          description: "Verifique se o CEP está correto e tente novamente."
        });
      } else {
        toast({
          variant: "destructive",
          title: "❌ Erro ao salvar endereço",
          description: errorMsg
        });
      }
    }
  });

  // Enhanced retry functionality
  const retryOperation = useCallback(async () => {
    toast({
      title: "🔄 Tentando novamente",
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

  // Enhanced addAddress function for useCheckout
  const addAddress = async (formData: Partial<Address>): Promise<Address | null> => {
    try {
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
        ...formData
      };

      const validation = validateAddress(fullAddress);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const result = await addressService.addAddress(fullAddress);
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
    addAddress,
    validateAddress,
    isSettingPrimary: setPrimaryAddressMutation.isPending,
  };
}
