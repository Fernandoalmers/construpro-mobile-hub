
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
      
      // LIMITADO: Invalidar apenas queries específicas sem refetch automático
      queryClient.invalidateQueries({
        queryKey: ['marketplace-products'],
        refetchType: 'none' // Não fazer refetch imediato
      });
      
      console.log('[useDeliveryZones] ✅ Zonas resolvidas:', {
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
      const { newCep, profile: updatedProfile } = event.detail;
      
      if (newCep && newCep !== currentCep) {
        console.log('[useDeliveryZones] 🏠 Endereço principal mudou via evento:', newCep);
        
        try {
          // Re-resolver zonas com o novo CEP
          await resolveZones(newCep);
        } catch (error) {
          console.error('[useDeliveryZones] Erro ao resolver zonas após mudança de endereço:', error);
        }
      }
    };

    window.addEventListener('primary-address-changed', handlePrimaryAddressChange as EventListener);
    
    return () => {
      window.removeEventListener('primary-address-changed', handlePrimaryAddressChange as EventListener);
    };
  }, [resolveZones, currentCep]);

  // ESTABILIZADO: Inicialização única sem loops
  useEffect(() => {
    if (initialized) return;

    const initializeZones = async () => {
      console.log('[useDeliveryZones] 🚀 Inicializando zonas de entrega...');
      
      try {
        // REMOVIDO: Tentativa de carregar contexto salvo para evitar calls desnecessários
        
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

  // REMOVIDO: useEffect que observa mudanças no perfil para evitar loops

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
