
import { useState, useEffect, useMemo } from 'react';
import { useDeliveryZones } from './useDeliveryZones';

interface MarketplaceFiltersReturn {
  shouldShowAllProducts: boolean;
  isFilteredByZone: boolean;
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

  // Resetar filtro quando não há zonas ativas
  useEffect(() => {
    if (!hasActiveZones) {
      setShowAllProducts(false);
    }
  }, [hasActiveZones]);

  const shouldShowAllProducts = showAllProducts || !hasActiveZones;
  const isFilteredByZone = hasActiveZones && !showAllProducts;

  const currentZoneInfo = useMemo(() => ({
    cep: currentCep,
    vendorCount: currentZones.length,
    zoneNames: [...new Set(currentZones.map(zone => zone.zone_name))]
  }), [currentCep, currentZones]);

  const toggleZoneFilter = () => {
    setShowAllProducts(!showAllProducts);
  };

  const clearAllFilters = () => {
    setShowAllProducts(true);
  };

  return {
    shouldShowAllProducts,
    isFilteredByZone,
    currentZoneInfo,
    toggleZoneFilter,
    clearAllFilters
  };
};
