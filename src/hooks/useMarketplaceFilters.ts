
import { useState, useEffect, useMemo } from 'react';
import { useDeliveryZones } from './useDeliveryZones';

interface MarketplaceFiltersReturn {
  shouldShowAllProducts: boolean;
  isFilteredByZone: boolean;
  hasDefinedCepWithoutCoverage: boolean;
  currentZoneInfo: {
    cep: string | null;
    vendorCount: number;
    zoneNames: string[];
  };
  toggleZoneFilter: () => void;
  clearAllFilters: () => void;
}

export const useMarketplaceFilters = (): MarketplaceFiltersReturn => {
  const { hasActiveZones, currentZones, currentCep } = useDeliveryZones();
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Estado crítico: CEP definido mas sem vendedores que atendem
  const hasDefinedCepWithoutCoverage = Boolean(currentCep && !hasActiveZones);

  // Resetar filtro quando não há zonas ativas
  useEffect(() => {
    if (!hasActiveZones) {
      setShowAllProducts(false);
    }
  }, [hasActiveZones]);

  // Lógica corrigida para determinar se deve mostrar todos os produtos
  const shouldShowAllProducts = useMemo(() => {
    // Se não há CEP definido, mostrar todos os produtos
    if (!currentCep) {
      return true;
    }
    
    // Se há CEP mas sem cobertura, NÃO mostrar todos os produtos
    if (hasDefinedCepWithoutCoverage) {
      return false;
    }
    
    // Se há cobertura, respeitar a escolha do usuário
    return showAllProducts || !hasActiveZones;
  }, [currentCep, hasDefinedCepWithoutCoverage, showAllProducts, hasActiveZones]);

  const isFilteredByZone = hasActiveZones && !showAllProducts;

  const currentZoneInfo = useMemo(() => ({
    cep: currentCep,
    vendorCount: currentZones.length,
    zoneNames: [...new Set(currentZones.map(zone => zone.zone_name))]
  }), [currentCep, currentZones]);

  const toggleZoneFilter = () => {
    // Só permitir toggle se há zonas ativas
    if (hasActiveZones) {
      setShowAllProducts(!showAllProducts);
    }
  };

  const clearAllFilters = () => {
    // Só permitir limpar filtros se há zonas ativas
    if (hasActiveZones) {
      setShowAllProducts(true);
    }
  };

  return {
    shouldShowAllProducts,
    isFilteredByZone,
    hasDefinedCepWithoutCoverage,
    currentZoneInfo,
    toggleZoneFilter,
    clearAllFilters
  };
};
