
import React from 'react';
import { MapPin, AlertCircle, Package, Settings } from 'lucide-react';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useMarketplaceFilters } from '@/hooks/useMarketplaceFilters';

interface DeliveryZoneIndicatorProps {
  className?: string;
}

const DeliveryZoneIndicator: React.FC<DeliveryZoneIndicatorProps> = ({ className = "" }) => {
  const { currentZones, currentCep, hasActiveZones, isLoading } = useDeliveryZones();
  const { shouldShowAllProducts, isFilteredByZone, toggleZoneFilter } = useMarketplaceFilters();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span>Verificando zona de entrega...</span>
      </div>
    );
  }

  if (!hasActiveZones) {
    return (
      <div className={`flex items-center justify-between gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>Todos os produtos disponíveis</span>
        </div>
      </div>
    );
  }

  const vendorCount = currentZones.length;
  const formatCep = currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2');

  if (shouldShowAllProducts) {
    return (
      <div className={`flex items-center justify-between gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-medium">Exibindo todos os produtos</span>
            <span className="text-xs text-blue-500">
              {vendorCount} loja{vendorCount !== 1 ? 's' : ''} disponíve{vendorCount !== 1 ? 'is' : 'l'} para {formatCep}
            </span>
          </div>
        </div>
        <button 
          onClick={toggleZoneFilter}
          className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
        >
          Filtrar por região
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="font-medium">
            Entrega para {formatCep}
          </span>
          <span className="text-xs text-green-600">
            {vendorCount} loja{vendorCount !== 1 ? 's' : ''} disponíve{vendorCount !== 1 ? 'is' : 'l'}
          </span>
        </div>
      </div>
      <button 
        onClick={toggleZoneFilter}
        className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded transition-colors"
      >
        Ver todos
      </button>
    </div>
  );
};

export default DeliveryZoneIndicator;
