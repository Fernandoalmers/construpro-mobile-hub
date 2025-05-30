
import React from 'react';
import { MapPin } from 'lucide-react';

interface DeliveryAddressDisplayProps {
  endereco: any;
}

const DeliveryAddressDisplay: React.FC<DeliveryAddressDisplayProps> = ({ endereco }) => {
  if (!endereco) return null;
  
  // Helper function to format address consistently
  const formatAddress = (addr: any) => {
    if (typeof addr === 'string') {
      return addr;
    }
    
    if (typeof addr === 'object') {
      // Handle both Portuguese field names (rua, numero, etc.) and English names (logradouro, etc.)
      const rua = addr.rua || addr.logradouro || '';
      const numero = addr.numero || '';
      const complemento = addr.complemento || '';
      const bairro = addr.bairro || '';
      const cidade = addr.cidade || '';
      const estado = addr.estado || '';
      const cep = addr.cep || '';
      
      // Build address string with proper formatting
      const parts = [];
      
      if (rua) {
        let ruaText = rua;
        if (numero) ruaText += `, ${numero}`;
        if (complemento) ruaText += `, ${complemento}`;
        parts.push(ruaText);
      }
      
      if (bairro) parts.push(bairro);
      if (cidade && estado) {
        parts.push(`${cidade} - ${estado}`);
      } else if (cidade) {
        parts.push(cidade);
      } else if (estado) {
        parts.push(estado);
      }
      
      if (cep) parts.push(`CEP: ${cep}`);
      
      return parts.join(', ') || 'Endereço não disponível';
    }
    
    return 'Endereço não disponível';
  };
  
  return (
    <div className="pt-3 border-t">
      <h3 className="font-medium mb-2 flex items-center">
        <MapPin className="mr-2" size={18} />
        Endereço de Entrega
      </h3>
      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
        {formatAddress(endereco)}
      </p>
    </div>
  );
};

export default DeliveryAddressDisplay;
