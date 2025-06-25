import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService, Address } from '@/services/addressService';
import { addressCacheService } from '@/services/addressCacheService';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export function useAddresses() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [cachedAddresses, setCachedAddresses] = useState<Address[]>([]);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  // Carregar cache imediatamente de forma síncrona para exibição instantânea
  useEffect(() => {
    console.log('[useAddresses] 🏠 Carregando endereços do cache para exibição instantânea...');
    
    // Carregar cache de forma síncrona
    try {
      const cached = addressCacheService.loadFromCache();
      if (cached && cached.length > 0) {
        setCachedAddresses(cached);
        console.log('[useAddresses] ✅ Endereços do cache disponíveis instantaneamente:', cached.length);
      } else {
        console.log('[useAddresses] ℹ️ Cache vazio - aguardando servidor');
      }
    } catch (error) {
      console.warn('[useAddresses] ⚠️ Erro ao carregar cache:', error);
    } finally {
      setIsCacheLoaded(true);
    }
  }, []);

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

  // Fetch addresses em background sem bloquear exibição do cache
  const { 
    data: serverAddresses = [], 
    isLoading: isLoadingServer, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      try {
        console.log("🔄 Sincronizando endereços com servidor em background...");
        const data = await addressService.getAddresses();
        
        // Salvar no cache após sucesso
        addressCacheService.saveToCache(data);
        
        // Atualizar cache local também
        setCachedAddresses(data);
        
        console.log("✅ Endereços sincronizados com sucesso:", data.length);
        setErrorDetails(null);
        return data;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("❌ Erro ao sincronizar endereços:", errorMsg);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2) {
        console.log(`🔄 Tentativa ${failureCount + 1} de sincronização de endereços`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
    enabled: isCacheLoaded // Só sincronizar após cache carregar
  });

  // Priorizar dados do servidor se disponíveis e mais recentes, senão usar cache
  const addresses = useMemo(() => {
    // Se dados do servidor estão disponíveis e são mais recentes, usar eles
    if (serverAddresses.length > 0) {
      return serverAddresses;
    }
    
    // Caso contrário, usar cache para exibição instantânea
    return cachedAddresses;
  }, [serverAddresses, cachedAddresses]);
  
  // Loading só se não há dados nem do cache nem do servidor E ainda não carregou cache
  const isLoading = !isCacheLoaded || (cachedAddresses.length === 0 && isLoadingServer);

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`🗑️ Removendo endereço: ${addressId}`);
        return await addressService.deleteAddress(addressId);
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("❌ Erro ao remover endereço:", errorMsg);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refreshProfile();
      addressCacheService.clearCache();
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

  // Set primary address mutation
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`[useAddresses] 🏠 Definindo endereço ${addressId} como principal`);
        
        const currentAddresses = addresses;
        const addressExists = currentAddresses.find(addr => addr.id === addressId);
        
        if (!addressExists) {
          throw new Error('Endereço não encontrado. Atualize a página e tente novamente.');
        }
        
        const result = await addressService.setPrimaryAddress(addressId);
        return result;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("[useAddresses] ❌ Erro ao definir endereço principal:", errorMsg);
        throw err;
      }
    },
    onMutate: async (addressId: string) => {
      console.log(`[useAddresses] ⚡ Atualização otimista: endereço ${addressId} como principal`);
      
      await queryClient.cancelQueries({ queryKey: ['addresses'] });
      const previousAddresses = queryClient.getQueryData(['addresses']) as Address[];
      
      if (previousAddresses) {
        const optimisticAddresses = previousAddresses.map(addr => ({
          ...addr,
          principal: addr.id === addressId
        }));
        
        queryClient.setQueryData(['addresses'], optimisticAddresses);
      }
      
      return { previousAddresses };
    },
    onSuccess: (result, addressId) => {
      console.log(`[useAddresses] ✅ Endereço principal definido:`, addressId);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refreshProfile();
      addressCacheService.clearCache();
      
      toast({
        title: "✅ Endereço principal atualizado",
        description: "Endereço definido como principal com sucesso.",
        duration: 3000
      });
    },
    onError: (error: any, addressId, context) => {
      console.error(`[useAddresses] ❌ Falha ao definir endereço principal ${addressId}:`, error);
      
      if (context?.previousAddresses) {
        queryClient.setQueryData(['addresses'], context.previousAddresses);
      }
      
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao definir endereço principal", 
        description: errorMsg
      });
    }
  });

  // Save address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (data: { address: Address, isEdit: boolean }) => {
      try {
        console.log("💾 Salvando endereço:", data.isEdit ? "Edição" : "Novo", data.address);
        
        const validation = validateAddress(data.address);
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        
        const cleanedAddress = {
          ...data.address,
          cep: data.address.cep.replace(/\D/g, '')
        };
        
        if (data.isEdit && data.address.id) {
          return await addressService.updateAddress(data.address.id, cleanedAddress);
        } else {
          return await addressService.addAddress(cleanedAddress);
        }
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("❌ Erro ao salvar endereço:", errorMsg);
        throw err;
      }
    },
    onSuccess: (result, variables) => {
      console.log("✅ Endereço salvo com sucesso:", result);
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refreshProfile();
      addressCacheService.clearCache();
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
      toast({
        variant: "destructive",
        title: "❌ Erro ao salvar endereço",
        description: errorMsg
      });
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
    console.log(`[useAddresses] 🏠 Usuário solicitou definir endereço ${addressId} como principal`);
    setPrimaryAddressMutation.mutate(addressId);
  };

  const handleEditAddress = (address: Address) => {
    console.log('[useAddresses] ✏️ Editando endereço:', address);
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Tem certeza que deseja remover este endereço?')) {
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleAddAddress = () => {
    console.log('[useAddresses] ➕ Abrindo modal para novo endereço');
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAddress = (address: Address) => {
    console.log("💾 handleSaveAddress chamado com:", address);
    const isEdit = Boolean(editingAddress);
    saveAddressMutation.mutate({ address, isEdit });
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
      addressCacheService.clearCache();
      await refreshProfile();
      
      return result;
    } catch (error) {
      console.error("❌ Erro ao adicionar endereço:", error);
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
