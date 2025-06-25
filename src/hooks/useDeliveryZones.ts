
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

  // CORRIGIDO: Função para obter CEP com prioridades corretas
  const getUserCep = useCallback(() => {
    // 1. CEP do perfil principal (usuários autenticados)
    if (isAuthenticated && profile?.endereco_principal?.cep) {
      const cep = profile.endereco_principal.cep.replace(/\D/g, '');
      console.log('[useDeliveryZones] 🏠 Usando CEP do perfil principal:', cep);
      return cep;
    }
    
    // 2. CEP temporário (usuários não autenticados)
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
    
    console.log('[useDeliveryZones] 🔍 Resolvendo zonas para CEP:', cleanCep);
    setIsLoading(true);
    setError(null);
    
    try {
      const zones = await deliveryZoneService.resolveUserZones(cleanCep);
      
      setCurrentZones(zones);
      setCurrentCep(cleanCep);
      
      // Invalidar queries para atualizar produtos
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: ['marketplace-products'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({
          queryKey: ['marketplace-products-by-zone'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({
          queryKey: ['marketplace-stores'],
          refetchType: 'active'
        })
      ]);
      
      console.log('[useDeliveryZones] ✅ Zonas resolvidas e cache invalidado:', {
        cep: cleanCep,
        zonas: zones.length
      });
      
      // Salvar contexto em background
      try {
        await deliveryZoneService.saveUserDeliveryContext(cleanCep, zones, profile?.id);
      } catch (contextError) {
        console.warn('[useDeliveryZones] ⚠️ Aviso ao salvar contexto:', contextError);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resolver zonas de entrega';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, queryClient]);

  const clearZones = useCallback(() => {
    console.log('[useDeliveryZones] 🧹 Limpando zonas de entrega');
    setCurrentZones([]);
    setCurrentCep(null);
    setError(null);
    
    queryClient.invalidateQueries({
      queryKey: ['marketplace-products']
    });
  }, [queryClient]);

  // NOVO: Observar mudanças no endereco_principal do perfil
  useEffect(() => {
    if (!initialized || !isAuthenticated) return;
    
    const profileCep = profile?.endereco_principal?.cep?.replace(/\D/g, '');
    
    // Se o CEP do perfil mudou e é diferente do atual, resolver automaticamente
    if (profileCep && profileCep !== currentCep && profileCep.length === 8) {
      console.log('[useDeliveryZones] 🔄 CEP do perfil mudou, resolvendo automaticamente:', profileCep);
      resolveZones(profileCep).catch(err => {
        console.error('[useDeliveryZones] ❌ Erro ao resolver CEP do perfil:', err);
      });
    }
  }, [profile?.endereco_principal?.cep, currentCep, initialized, isAuthenticated, resolveZones]);

  // Inicialização única melhorada
  useEffect(() => {
    if (initialized) return;

    const initializeZones = async () => {
      console.log('[useDeliveryZones] 🚀 Inicializando zonas de entrega...');
      
      try {
        // Tentar carregar contexto salvo primeiro
        const context = await deliveryZoneService.getUserDeliveryContext(profile?.id).catch(() => null);
        
        if (context && context.resolved_zone_ids.length > 0) {
          console.log('[useDeliveryZones] 📋 Contexto salvo encontrado:', context.current_cep);
          await resolveZones(context.current_cep);
          setInitialized(true);
          return;
        }
        
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

    const timer = setTimeout(initializeZones, 200);
    return () => clearTimeout(timer);
  }, [initialized, profile?.id, getUserCep, resolveZones]);

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
