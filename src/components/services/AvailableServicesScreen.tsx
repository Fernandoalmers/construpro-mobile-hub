
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import CustomInput from '../common/CustomInput';
import ServiceRequestCard from './ServiceRequestCard';
import ListEmptyState from '../common/ListEmptyState';
import { serviceRequestsMock } from '@/data/serviceRequests';

interface AvailableServicesScreenProps {
  isProfessional: boolean;
}

const AvailableServicesScreen: React.FC<AvailableServicesScreenProps> = ({ isProfessional }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const serviceRequests = serviceRequestsMock;

  // Filter available service requests (status === 'open')
  const availableServices = serviceRequests.filter(
    request => request.status === 'aberto' && 
    (searchQuery === '' || 
      request.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4">
      <CustomInput
        placeholder="Buscar serviços..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        isSearch
      />

      <div className="flex flex-col gap-3">
        {availableServices.length > 0 ? (
          availableServices.map(service => (
            <ServiceRequestCard 
              key={service.id} 
              service={service} 
              isProfessional={isProfessional} 
              showSendProposalButton={isProfessional}
            />
          ))
        ) : (
          <ListEmptyState
            icon={<Search className="h-12 w-12 text-gray-400" />}
            title="Nenhum serviço disponível"
            description="Não há solicitações de serviço disponíveis no momento."
          />
        )}
      </div>
    </div>
  );
};

export default AvailableServicesScreen;
