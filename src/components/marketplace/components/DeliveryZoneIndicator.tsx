
import React from 'react';
import { MapPin, AlertCircle, Package, Settings } from 'lucide-react';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useMarketplaceFilters } from '@/hooks/useMarketplaceFilters';

interface DeliveryZoneIndicatorProps {
  className?: string;
}

const DeliveryZoneIndicator: React.FC<DeliveryZoneIndicatorProps> = ({ className = "" }) => {
  const { currentZones, currentCep, hasActiveZones, isLoading } = useDeliveryZones();
  const { shouldShowAllProducts, isFilteredByZone, hasDefinedCepWithoutCoverage, toggleZoneFilter } = useMarketplaceFilters();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span>Verificando zona de entrega...</span>
      </div>
    );
  }

  // Estado: CEP definido mas sem vendedores que atendem
  if (hasDefinedCepWithoutCoverage) {
    const formatCep = currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2');
    return (
      <div className={`flex items-center justify-between gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-medium">Nenhum lojista atende {formatCep}</span>
            <span className="text-xs text-red-500">
              Tente outro CEP ou navegue sem filtro de região
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Sem CEP definido - mostrando todos os produtos
  if (!currentCep) {
    return (
      <div className={`flex items-center justify-between gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>Todos os produtos disponíveis - Defina um CEP para ver entregas locais</span>
        </div>
      </div>
    );
  }

  const vendorCount = currentZones.length;
  const formatCep = currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2');

  // NOVO: Estado informativo quando não há zonas mas há CEP
  if (currentCep && !hasActiveZones) {
    return (
      <div className={`flex items-center justify-between gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="font-medium">CEP {formatCep} definido</span>
            <span className="text-xs text-orange-500">
              Nenhuma loja configurada para entrega neste CEP - Mostrando todos os produtos
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Estado: CEP com cobertura mas mostrando todos os produtos
  if (shouldShowAllProducts && hasActiveZones) {
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

  // Estado: CEP com cobertura e filtrando por zona
  if (hasActiveZones) {
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
  }

  // Fallback
  return null;
};

export default DeliveryZoneIndicator;
