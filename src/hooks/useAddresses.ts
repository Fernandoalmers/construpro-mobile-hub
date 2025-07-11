
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
    retry: 1,
    retryDelay: 2000,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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

  // MELHORADO: Set primary address mutation com sincronização completa
  const setPrimaryAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      try {
        console.log(`[useAddresses] 🏠 Definindo endereço ${addressId} como principal`);
        
        if (!user?.id) {
          throw new Error('Usuário não autenticado');
        }
        
        const currentAddresses = addresses;
        const addressToSet = currentAddresses.find(addr => addr.id === addressId);
        
        if (!addressToSet) {
          throw new Error('Endereço não encontrado. Atualize a página e tente novamente.');
        }
        
        // Executar a mudança no servidor
        await addressService.setPrimaryAddress(addressId, user.id);
        
        console.log(`[useAddresses] ✅ Endereço principal definido no servidor`);
        return { addressId, newCep: addressToSet.cep };
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("[useAddresses] ❌ Erro ao definir endereço principal:", errorMsg);
        throw err;
      }
    },
    onSuccess: async (result) => {
      const { addressId, newCep } = result;
      console.log(`[useAddresses] 🔄 Iniciando sincronização completa para endereço:`, addressId);
      
      try {
        // PASSO 1: Forçar refresh do perfil no AuthContext
        console.log(`[useAddresses] 📋 Forçando refresh do perfil no AuthContext...`);
        await refreshProfile();
        
        // PASSO 2: Aguardar um pouco para garantir sincronização
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // PASSO 3: Invalidar e forçar refetch das queries
        console.log(`[useAddresses] 🗂️ Invalidando cache e forçando refetch...`);
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        addressCacheService.clearCache();
        setCachedAddresses([]);
        
        // PASSO 4: Disparar evento customizado para comunicação entre páginas
        console.log(`[useAddresses] 📡 Disparando evento de mudança de endereço principal...`);
        window.dispatchEvent(new CustomEvent('primary-address-changed', {
          detail: { 
            newCep, 
            addressId,
            timestamp: Date.now()
          }
        }));
        
        // PASSO 5: Forçar refetch imediato
        setTimeout(() => {
          refetch();
        }, 100);
        
        console.log(`[useAddresses] 🎉 Sincronização completa finalizada com sucesso`);
        
        toast({
          title: "✅ Endereço principal atualizado",
          description: "Endereço definido como principal e sincronizado em todo o sistema.",
          duration: 3000
        });
      } catch (syncError) {
        console.error(`[useAddresses] ⚠️ Erro na sincronização pós-mudança:`, syncError);
        toast({
          variant: "destructive",
          title: "⚠️ Endereço atualizado com aviso",
          description: "Endereço foi alterado, mas pode precisar de alguns segundos para sincronizar."
        });
      }
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

  // MELHORADO: Save address mutation com logs detalhados e handling aprimorado
  const saveAddressMutation = useMutation({
    mutationFn: async (data: { address: Address, isEdit: boolean }) => {
      try {
        console.log("💾 [saveAddressMutation] Iniciando salvamento:", {
          isEdit: data.isEdit,
          addressId: data.address.id,
          nome: data.address.nome,
          cep: data.address.cep,
          userId: user?.id
        });
        
        const validation = validateAddress(data.address);
        if (!validation.isValid) {
          console.error("❌ [saveAddressMutation] Validação falhou:", validation.errors);
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        
        const cleanedAddress = {
          ...data.address,
          cep: data.address.cep.replace(/\D/g, ''),
          user_id: user?.id || data.address.user_id
        };
        
        console.log("📤 [saveAddressMutation] Chamando serviço com dados limpos:", cleanedAddress);
        
        let result;
        if (data.isEdit && data.address.id) {
          console.log("✏️ [saveAddressMutation] Editando endereço existente");
          result = await addressService.updateAddress(data.address.id, cleanedAddress);
        } else {
          console.log("➕ [saveAddressMutation] Criando novo endereço");
          result = await addressService.addAddress(cleanedAddress);
        }
        
        console.log("✅ [saveAddressMutation] Resposta do serviço:", result);
        return result;
      } catch (err) {
        const errorMsg = formatErrorMessage(err);
        console.error("❌ [saveAddressMutation] Erro ao salvar endereço:", errorMsg, err);
        throw err;
      }
    },
    onSuccess: (result, variables) => {
      console.log("🎉 [saveAddressMutation] Sucesso! Resultado:", result);
      
      // Invalidar queries e limpar cache
      console.log("🗂️ [saveAddressMutation] Invalidando queries e limpando cache...");
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      addressCacheService.clearCache();
      
      // Forçar refetch imediato
      console.log("🔄 [saveAddressMutation] Forçando refetch...");
      setTimeout(() => {
        refetch();
      }, 100);
      
      setErrorDetails(null);
      toast({
        title: variables.isEdit ? "✅ Endereço atualizado" : "✅ Endereço adicionado",
        description: variables.isEdit 
          ? "Endereço atualizado com sucesso." 
          : "Endereço adicionado com sucesso."
      });
      setIsAddModalOpen(false);
      setEditingAddress(null);
      
      console.log("✅ [saveAddressMutation] Processo de salvamento concluído com sucesso");
    },
    onError: (error: any, variables) => {
      console.error("❌ [saveAddressMutation] Erro na mutation:", {
        error,
        variables,
        errorMessage: error?.message,
        errorDetails: error
      });
      
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
    console.log("💾 [useAddresses] handleSaveAddress chamado com:", address);
    const isEdit = Boolean(editingAddress);
    console.log("🔄 [useAddresses] Disparando mutation, isEdit:", isEdit);
    saveAddressMutation.mutate({ address, isEdit });
  };

  // Enhanced addAddress function for useCheckout
  const addAddress = async (formData: Partial<Address>): Promise<Address | null> => {
    try {
      console.log("➕ [useAddresses] addAddress chamado com:", formData);
      
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
        console.error("❌ [useAddresses] Validação falhou no addAddress:", validation.errors);
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      console.log("📤 [useAddresses] Chamando addressService.addAddress...");
      const result = await addressService.addAddress(fullAddress);
      console.log("✅ [useAddresses] Resultado do addAddress:", result);
      
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      addressCacheService.clearCache();
      
      return result;
    } catch (error) {
      console.error("❌ [useAddresses] Erro ao adicionar endereço:", error);
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
