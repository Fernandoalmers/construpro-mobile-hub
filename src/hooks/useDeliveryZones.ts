
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

  // Função para obter CEP do usuário com prioridades corretas
  const getUserCep = useCallback(() => {
    console.log('[useDeliveryZones] Obtendo CEP do usuário...');
    
    // 1. Primeiro: CEP do perfil principal (usuários autenticados)
    if (isAuthenticated && profile?.endereco_principal?.cep) {
      const cep = profile.endereco_principal.cep.replace(/\D/g, '');
      console.log('[useDeliveryZones] ✅ CEP do perfil principal:', cep);
      return cep;
    }
    
    // 2. Segundo: CEP temporário (usuários não autenticados)
    if (!isAuthenticated && tempCep) {
      const cep = tempCep.replace(/\D/g, '');
      console.log('[useDeliveryZones] ✅ CEP temporário:', cep);
      return cep;
    }
    
    console.log('[useDeliveryZones] ❌ Nenhum CEP disponível');
    return null;
  }, [isAuthenticated, profile?.endereco_principal?.cep, tempCep]);

  const resolveZones = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (!cleanCep || cleanCep.length !== 8) {
      console.log('[useDeliveryZones] ❌ CEP inválido:', cleanCep);
      throw new Error('CEP inválido');
    }
    
    // CORRIGIDO: Sempre processar, mesmo se for o mesmo CEP, para garantir que funcione
    console.log('[useDeliveryZones] 🔍 Iniciando resolução de zonas para CEP:', cleanCep);
    setIsLoading(true);
    setError(null);
    
    try {
      const zones = await deliveryZoneService.resolveUserZones(cleanCep);
      
      console.log('[useDeliveryZones] 📍 Zonas encontradas:', zones.length);
      setCurrentZones(zones);
      setCurrentCep(cleanCep);
      
      // Invalidação simplificada e direta
      console.log('[useDeliveryZones] 🔄 Invalidando queries do marketplace...');
      
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: ['marketplace-products'],
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({
          queryKey: ['marketplace-stores'],
          refetchType: 'active'
        })
      ]);
      
      console.log('[useDeliveryZones] ✅ Queries invalidadas');
      
      // Salvar contexto em background
      try {
        await deliveryZoneService.saveUserDeliveryContext(cleanCep, zones, profile?.id);
        console.log('[useDeliveryZones] ✅ Contexto salvo com sucesso');
      } catch (contextError) {
        console.warn('[useDeliveryZones] ⚠️ Aviso ao salvar contexto:', contextError);
      }
      
      console.log('[useDeliveryZones] ✅ Resolução completa! Zonas:', zones.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resolver zonas de entrega';
      setError(errorMessage);
      console.error('[useDeliveryZones] ❌ Erro na resolução:', err);
      throw err; // Propagar erro para o SmartCepModal
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, queryClient]);

  const clearZones = useCallback(() => {
    console.log('[useDeliveryZones] 🧹 Limpando zonas');
    setCurrentZones([]);
    setCurrentCep(null);
    setError(null);
    
    // Invalidar queries ao limpar zonas também
    queryClient.invalidateQueries({
      queryKey: ['marketplace-products']
    });
  }, [queryClient]);

  // Inicialização única para evitar loops
  useEffect(() => {
    if (initialized) return;

    const initializeZones = async () => {
      console.log('[useDeliveryZones] 🚀 Inicializando sistema de zonas');
      
      try {
        // Primeiro: Tentar carregar contexto salvo
        const context = await deliveryZoneService.getUserDeliveryContext(profile?.id).catch(() => null);
        
        if (context && context.resolved_zone_ids.length > 0) {
          console.log('[useDeliveryZones] 📂 Contexto salvo encontrado, resolvendo zonas...');
          await resolveZones(context.current_cep);
          setInitialized(true);
          return;
        }
        
        // Segundo: Usar CEP atual do usuário
        const userCep = getUserCep();
        if (userCep && userCep.length === 8) {
          console.log('[useDeliveryZones] 🏠 Resolvendo com CEP do usuário...');
          await resolveZones(userCep);
        } else {
          console.log('[useDeliveryZones] ℹ️ Nenhum CEP disponível para resolução automática');
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

  // Reagir a mudanças no CEP do usuário apenas após inicialização
  useEffect(() => {
    if (!initialized) return;
    
    const userCep = getUserCep();
    
    if (userCep && userCep !== currentCep && userCep.length === 8) {
      console.log('[useDeliveryZones] 🔄 CEP do usuário mudou, resolvendo zonas...');
      resolveZones(userCep);
    }
  }, [initialized, getUserCep, currentCep, resolveZones]);

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
