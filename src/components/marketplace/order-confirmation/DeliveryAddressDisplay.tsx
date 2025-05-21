
import React from 'react';
import { MapPin } from 'lucide-react';

interface DeliveryAddressDisplayProps {
  endereco: any;
}

const DeliveryAddressDisplay: React.FC<DeliveryAddressDisplayProps> = ({ endereco }) => {
  if (!endereco) return null;
  
  return (
    <div className="pt-3 border-t">
      <h3 className="font-medium mb-2 flex items-center">
        <MapPin className="mr-2" size={18} />
        Endereço de Entrega
      </h3>
      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        {typeof endereco === 'string' 
          ? endereco
          : `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}`
        }
      </p>
    </div>
  );
};

export default DeliveryAddressDisplay;
