
import { useState, useEffect, useCallback } from 'react';
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
    
    if (!cleanCep || cleanCep.length !== 8 || cleanCep === currentCep) {
      return;
    }
    
    console.log('[useDeliveryZones] 🔍 Resolvendo zonas para CEP:', cleanCep);
    setIsLoading(true);
    setError(null);
    
    try {
      const zones = await deliveryZoneService.resolveUserZones(cleanCep);
      
      setCurrentZones(zones);
      setCurrentCep(cleanCep);
      
      // Salvar contexto sem aguardar para evitar loops
      deliveryZoneService.saveUserDeliveryContext(cleanCep, zones, profile?.id).catch(err => {
        console.warn('[useDeliveryZones] Erro ao salvar contexto:', err);
      });
      
      console.log('[useDeliveryZones] ✅ Zonas resolvidas:', zones.length);
      
      if (zones.length > 0) {
        const vendorCount = zones.length;
        const uniqueZones = [...new Set(zones.map(z => z.zone_name))];
        console.log(`[useDeliveryZones] 📍 ${vendorCount} vendedor(es) atendem a região`, uniqueZones);
      } else {
        console.log('[useDeliveryZones] ⚠️ Nenhum vendedor atende a região');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resolver zonas de entrega';
      setError(errorMessage);
      console.error('[useDeliveryZones] ❌ Erro:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCep, profile?.id]);

  const clearZones = useCallback(() => {
    console.log('[useDeliveryZones] 🧹 Limpando zonas');
    setCurrentZones([]);
    setCurrentCep(null);
    setError(null);
  }, []);

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

    // Aguardar um pouco para evitar corrida de condições
    const timer = setTimeout(initializeZones, 100);
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
