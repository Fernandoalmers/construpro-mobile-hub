
import React from 'react';
import { MapPin } from 'lucide-react';
import Card from '@/components/common/Card';
import CustomButton from '@/components/common/CustomButton';
import { Address } from '@/services/addressService';

interface DeliveryAddressSectionProps {
  selectedAddress: Address | null;
  onChangeAddress: () => void;
}

const DeliveryAddressSection: React.FC<DeliveryAddressSectionProps> = ({ 
  selectedAddress, 
  onChangeAddress 
}) => {
  return (
    <div>
      <h2 className="font-bold flex items-center mb-3">
        <MapPin size={18} className="mr-2" />
        Endereço de Entrega
      </h2>
      <Card className="p-4">
        {selectedAddress ? (
          <>
            <p className="font-medium">{selectedAddress.logradouro}, {selectedAddress.numero}</p>
            {selectedAddress.complemento && (
              <p className="text-gray-600">{selectedAddress.complemento}</p>
            )}
            <p className="text-gray-600">
              {selectedAddress.bairro}, {selectedAddress.cidade} - {selectedAddress.estado}
            </p>
            <p className="text-gray-600">
              {selectedAddress.cep}
            </p>
          </>
        ) : (
          <p className="text-gray-600">Nenhum endereço selecionado</p>
        )}
        <div className="mt-3 flex justify-end">
          <CustomButton 
            variant="link" 
            className="text-sm p-0"
            onClick={onChangeAddress}
          >
            {selectedAddress ? "Alterar endereço" : "Adicionar endereço"}
          </CustomButton>
        </div>
      </Card>
    </div>
  );
};

export default DeliveryAddressSection;
