
import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';

interface DeliveryZoneIndicatorProps {
  className?: string;
}

const DeliveryZoneIndicator: React.FC<DeliveryZoneIndicatorProps> = ({ className = "" }) => {
  const { currentZones, currentCep, hasActiveZones, isLoading } = useDeliveryZones();

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
      <div className={`flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>Todos os produtos disponíveis</span>
      </div>
    );
  }

  const uniqueZoneNames = [...new Set(currentZones.map(zone => zone.zone_name))];
  const vendorCount = currentZones.length;

  return (
    <div className={`flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg ${className}`}>
      <MapPin className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="font-medium">
          Entrega para {currentCep?.replace(/(\d{5})(\d{3})/, '$1-$2')}
        </span>
        <span className="text-xs text-green-600">
          {vendorCount} loja{vendorCount !== 1 ? 's' : ''} disponíve{vendorCount !== 1 ? 'is' : 'l'}
        </span>
      </div>
    </div>
  );
};

export default DeliveryZoneIndicator;
