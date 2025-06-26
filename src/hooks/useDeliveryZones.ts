
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useTempCep } from './useTempCep';
import { deliveryZoneService, type DeliveryZone } from '@/services/deliveryZoneService';

interface UseDeliveryZonesReturn {
  currentZones: DeliveryZone[];
  currentCep: string | null;
  isLoading: boolean;
  error: string | null;
  resolveZones: (cep: string) => Promise<void>;
  clearZones: () => void;
  hasActiveZones: boolean;
}

export const useDeliveryZones = (): UseDeliveryZonesReturn => {
  const { profile, isAuthenticated } = useAuth();
  const { tempCep } = useTempCep();
  const queryClient = useQueryClient();
  const [currentZones, setCurrentZones] = useState<DeliveryZone[]>([]);
  const [currentCep, setCurrentCep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // ESTABILIZADO: Função para obter CEP sem dependências reativas
  const getUserCep = useCallback(() => {
    if (isAuthenticated && profile?.endereco_principal?.cep) {
      const cep = profile.endereco_principal.cep.replace(/\D/g, '');
      console.log('[useDeliveryZones] 🏠 Usando CEP do perfil principal:', cep);
      return cep;
    }
    
    if (!isAuthenticated && tempCep) {
      const cep = tempCep.replace(/\D/g, '');
      console.log('[useDeliveryZones] 📍 Usando CEP temporário:', cep);
      return cep;
    }
    
    console.log('[useDeliveryZones] ❌ Nenhum CEP encontrado');
    return null;
  }, [isAuthenticated, profile?.endereco_principal?.cep, tempCep]);

  const resolveZones = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!cleanCep || cleanCep.length !== 8) {
      throw new Error('CEP inválido');
    }
    
    // OTIMIZADO: Evitar resolver novamente se já é o CEP atual
    if (cleanCep === currentCep && currentZones.length > 0) {
      console.log('[useDeliveryZones] ⚡ CEP já resolvido, pulando:', cleanCep);
      return;
    }
    
    console.log('[useDeliveryZones] 🔍 Resolvendo zonas para CEP:', cleanCep);
    setIsLoading(true);
    setError(null);
    
    try {
      const zones = await deliveryZoneService.resolveUserZones(cleanCep);
      
      setCurrentZones(zones);
      setCurrentCep(cleanCep);
      
      // LIMITADO: Invalidar queries do marketplace após mudança de zona
      console.log('[useDeliveryZones] 🔄 Invalidando queries do marketplace...');
      queryClient.invalidateQueries({
        queryKey: ['marketplace-products'],
        refetchType: 'active' // Refetch ativo para atualizar produtos
      });
      
      console.log('[useDeliveryZones] ✅ Zonas resolvidas e marketplace atualizado:', {
        cep: cleanCep,
        zonas: zones.length
      });
      
      // Salvar contexto em background sem await para não bloquear
      deliveryZoneService.saveUserDeliveryContext(cleanCep, zones, profile?.id).catch(error => {
        console.warn('[useDeliveryZones] ⚠️ Aviso ao salvar contexto:', error);
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resolver zonas de entrega';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentCep, currentZones.length, profile?.id, queryClient]);

  const clearZones = useCallback(() => {
    console.log('[useDeliveryZones] 🧹 Limpando zonas de entrega');
    setCurrentZones([]);
    setCurrentCep(null);
    setError(null);
    
    // LIMITADO: Invalidar sem refetch automático
    queryClient.invalidateQueries({
      queryKey: ['marketplace-products'],
      refetchType: 'none'
    });
  }, [queryClient]);

  // NOVO: Listener para mudanças no endereço principal via evento customizado
  useEffect(() => {
    const handlePrimaryAddressChange = async (event: CustomEvent) => {
      const { newCep, addressId } = event.detail;
      
      console.log('[useDeliveryZones] 📡 Evento de mudança de endereço recebido:', { newCep, addressId });
      
      if (newCep && newCep !== currentCep) {
        console.log('[useDeliveryZones] 🏠 Endereço principal mudou via evento, re-resolvendo zonas:', newCep);
        
        try {
          // Re-resolver zonas com o novo CEP
          await resolveZones(newCep);
          console.log('[useDeliveryZones] ✅ Zonas re-resolvidas com sucesso para novo endereço');
        } catch (error) {
          console.error('[useDeliveryZones] ❌ Erro ao resolver zonas após mudança de endereço:', error);
        }
      }
    };

    console.log('[useDeliveryZones] 📡 Configurando listener para mudanças de endereço principal');
    window.addEventListener('primary-address-changed', handlePrimaryAddressChange as EventListener);
    
    return () => {
      console.log('[useDeliveryZones] 📡 Removendo listener de mudanças de endereço principal');
      window.removeEventListener('primary-address-changed', handlePrimaryAddressChange as EventListener);
    };
  }, [resolveZones, currentCep]);

  // MELHORADO: Listener para mudanças diretas no perfil do AuthContext
  useEffect(() => {
    if (!initialized) return;
    
    const newUserCep = getUserCep();
    
    // Se o CEP do perfil mudou, re-resolver zonas automaticamente
    if (newUserCep && newUserCep !== currentCep && newUserCep.length === 8) {
      console.log('[useDeliveryZones] 📋 CEP do perfil mudou, re-resolvendo automaticamente:', {
        anterior: currentCep,
        novo: newUserCep
      });
      
      // Delay pequeno para permitir que outras atualizações sejam processadas
      setTimeout(() => {
        resolveZones(newUserCep).catch(error => {
          console.error('[useDeliveryZones] ❌ Erro ao re-resolver zonas por mudança no perfil:', error);
        });
      }, 300);
    }
  }, [profile?.endereco_principal?.cep, getUserCep, resolveZones, currentCep, initialized]);

  // ESTABILIZADO: Inicialização única sem loops
  useEffect(() => {
    if (initialized) return;

    const initializeZones = async () => {
      console.log('[useDeliveryZones] 🚀 Inicializando zonas de entrega...');
      
      try {
        // Usar CEP atual do usuário
        const userCep = getUserCep();
        if (userCep && userCep.length === 8) {
          console.log('[useDeliveryZones] 🎯 Inicializando com CEP do usuário:', userCep);
          await resolveZones(userCep);
        } else {
          console.log('[useDeliveryZones] ℹ️ Nenhum CEP disponível para inicialização');
        }
      } catch (err) {
        console.error('[useDeliveryZones] ❌ Erro na inicialização:', err);
      } finally {
        setInitialized(true);
      }
    };

    // ESTABILIZADO: Timeout maior para evitar múltiplas inicializações
    const timer = setTimeout(initializeZones, 500);
    return () => clearTimeout(timer);
  }, [initialized, getUserCep, resolveZones]);

  const hasActiveZones = currentZones.length > 0;

  return {
    currentZones,
    currentCep,
    isLoading,
    error,
    resolveZones,
    clearZones,
    hasActiveZones
  };
};
