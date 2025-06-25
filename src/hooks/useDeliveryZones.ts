
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  const { profile } = useAuth();
  const [currentZones, setCurrentZones] = useState<DeliveryZone[]>([]);
  const [currentCep, setCurrentCep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar contexto salvo na inicialização
  useEffect(() => {
    const loadSavedContext = async () => {
      try {
        const context = await deliveryZoneService.getUserDeliveryContext(profile?.id);
        
        if (context && context.resolved_zone_ids.length > 0) {
          // Resolver zonas novamente para garantir dados atualizados
          await resolveZones(context.current_cep);
        } else if (profile?.endereco_principal?.cep) {
          // Usar CEP do endereço principal se disponível
          await resolveZones(profile.endereco_principal.cep);
        }
      } catch (err) {
        console.error('[useDeliveryZones] Erro ao carregar contexto:', err);
      }
    };

    loadSavedContext();
  }, [profile?.id, profile?.endereco_principal?.cep]);

  const resolveZones = useCallback(async (cep: string) => {
    if (!cep || cep === currentCep) return;
    
    console.log('[useDeliveryZones] Resolvendo zonas para CEP:', cep);
    setIsLoading(true);
    setError(null);
    
    try {
      const zones = await deliveryZoneService.resolveUserZones(cep);
      
      setCurrentZones(zones);
      setCurrentCep(cep);
      
      // Salvar contexto
      await deliveryZoneService.saveUserDeliveryContext(cep, zones, profile?.id);
      
      console.log('[useDeliveryZones] Zonas resolvidas:', zones.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resolver zonas de entrega';
      setError(errorMessage);
      console.error('[useDeliveryZones] Erro:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCep, profile?.id]);

  const clearZones = useCallback(() => {
    setCurrentZones([]);
    setCurrentCep(null);
    setError(null);
  }, []);

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
