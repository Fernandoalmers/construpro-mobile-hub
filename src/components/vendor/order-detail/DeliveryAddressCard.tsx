
import React from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCompleteAddress } from '@/utils/addressFormatter';

interface DeliveryAddressCardProps {
  address: any;
}

const DeliveryAddressCard: React.FC<DeliveryAddressCardProps> = ({ address }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-2 mb-3">
        <MapPin size={16} className="text-gray-600 mt-0.5" />
        <h3 className="font-medium">Endereço de Entrega</h3>
      </div>
      <p className="text-sm text-gray-600">
        {formatCompleteAddress(address)}
      </p>
    </Card>
  );
};

export default DeliveryAddressCard;
