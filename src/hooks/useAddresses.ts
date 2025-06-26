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
  const { refreshProfile, user } = useAuth();

  // ESTABILIZADO: Carregar cache apenas uma vez
  useEffect(() => {
    if (isCacheLoaded) return;
    
    console.log('[useAddresses] 🏠 Carregando endereços do cache para exibição instantânea...');
    
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
  }, [isCacheLoaded]);

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

  // ESTABILIZADO: Fetch addresses com cache mais longo
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
        
        if (!user?.id) {
          throw new Error('Usuário não autenticado');
        }
        
        const data = await addressService.getUserAddresses(user.id);
        
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
    retry: 1, // REDUZIDO: Menos tentativas
    retryDelay: 2000, // AUMENTADO: Mais delay entre tentativas
    staleTime: 2 * 60 * 1000, // AUMENTADO: 2 minutos
    gcTime: 10 * 60 * 1000, // AUMENTADO: 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false, // ADICIONADO: Evitar refetch no mount
    enabled: isCacheLoaded && !!user?.id
  });

  // ESTABILIZADO: Priorizar dados sem mudanças reativas
  const addresses = useMemo(() => {
    if (serverAddresses.length > 0) {
      return serverAddresses;
    }
    return cachedAddresses;
  }, [serverAddresses, cachedAddresses]);
  
  const isLoading = !isCacheLoaded || (cachedAddresses.length === 0 && isLoadingServer);

  // ESTABILIZADO: Set primary address mutation sem refresh automático do perfil
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`[useAddresses] 🏠 Definindo endereço ${addressId} como principal`);
        
        if (!user?.id) {
          throw new Error('Usuário não autenticado');
        }
        
        const currentAddresses = addresses;
        const addressExists = currentAddresses.find(addr => addr.id === addressId);
        
        if (!addressExists) {
          throw new Error('Endereço não encontrado. Atualize a página e tente novamente.');
        }
        
        const result = await addressService.setPrimaryAddress(addressId, user.id);
        return result;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("[useAddresses] ❌ Erro ao definir endereço principal:", errorMsg);
        throw err;
      }
    },
    onSuccess: (result, addressId) => {
      console.log(`[useAddresses] ✅ Endereço principal definido:`, addressId);
      
      // OTIMIZADO: Invalidar queries específicas sem refetch automático
      queryClient.invalidateQueries({ queryKey: ['addresses'], refetchType: 'none' });
      
      // REMOVIDO: refreshProfile() para evitar loops de dependência
      // O perfil será atualizado automaticamente pelo trigger do banco
      
      addressCacheService.clearCache();
      
      toast({
        title: "✅ Endereço principal atualizado",
        description: "Endereço definido como principal com sucesso.",
        duration: 3000
      });
    },
    onError: (error: any, addressId, context) => {
      console.error(`[useAddresses] ❌ Falha ao definir endereço principal ${addressId}:`, error);
      
      const errorMsg = formatErrorMessage(error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao definir endereço principal", 
        description: errorMsg
      });
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['addresses'], refetchType: 'none' });
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
          cep: data.address.cep.replace(/\D/g, ''),
          user_id: user?.id || data.address.user_id
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
      queryClient.invalidateQueries({ queryKey: ['addresses'], refetchType: 'none' });
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
        user_id: user?.id || '',
        nome: formData.nome || '',
        cep: formData.cep?.replace(/\D/g, '') || '',
        logradouro: formData.logradouro || '',
        numero: formData.numero || '',
        complemento: formData.complemento || '',
        bairro: formData.bairro || '',
        cidade: formData.cidade || '',
        estado: formData.estado || '',
        principal: formData.principal || false,
        created_at: '',
        updated_at: '',
        ...formData
      };

      const validation = validateAddress(fullAddress);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const result = await addressService.addAddress(fullAddress);
      queryClient.invalidateQueries({ queryKey: ['addresses'], refetchType: 'none' });
      addressCacheService.clearCache();
      
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
